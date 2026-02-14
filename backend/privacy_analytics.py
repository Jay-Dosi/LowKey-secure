"""
privacy_analytics.py
────────────────────
Monthly privacy-risk metrics computation and rule-based advisory
for the Student Privacy Risk Advisor feature.

All functions operate on **aggregated, anonymised metrics only** —
no raw PII ever leaves the system boundary.
"""

from __future__ import annotations

import math
from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

import models
from models import get_ist_now
from privacy_engine import RISK_HIGH, RISK_MEDIUM, RISK_LOW

# ── Risk Weight Constants ──────────────────────────────────────────────
RISK_WEIGHTS: Dict[str, int] = {
    RISK_HIGH: 6,
    RISK_MEDIUM: 3,
    RISK_LOW: 1,
}


# ── Core Computation ───────────────────────────────────────────────────

def compute_monthly_metrics(
    student_id: int,
    month: str,
    db: Session,
) -> models.StudentPrivacyMetrics:
    """
    Compute (or re-compute) privacy metrics for *student_id* in *month*.

    Parameters
    ----------
    student_id : int
        The ``users.id`` of the student.
    month : str
        Target month in ``YYYY-MM`` format (e.g. ``"2026-02"``).
    db : Session
        Active SQLAlchemy session.

    Returns
    -------
    models.StudentPrivacyMetrics
        The persisted (upserted) metrics row.

    Notes
    -----
    * Idempotent — safe to call repeatedly for the same student/month.
    * Joins ``access_logs`` ↔ ``access_requests`` to pull risk metadata.
    """

    # ── 1. Derive month boundaries ─────────────────────────────────────
    month_start = datetime.strptime(month, "%Y-%m")
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1)

    # ── 2. Fetch logs for this student in the target month ─────────────
    logs: List[models.AccessLog] = (
        db.query(models.AccessLog)
        .filter(
            models.AccessLog.user_id == student_id,
            models.AccessLog.timestamp >= month_start,
            models.AccessLog.timestamp < month_end,
        )
        .all()
    )

    # ── 3. Aggregate counters ──────────────────────────────────────────
    total_events = len(logs)
    high_risk_count = 0
    medium_risk_count = 0
    low_risk_count = 0
    org_ids: List[int] = []
    high_attr_counter: Counter = Counter()  # track repeated HIGH-attr exposure

    for log in logs:
        request: Optional[models.AccessRequest] = (
            db.query(models.AccessRequest)
            .filter(models.AccessRequest.id == log.request_id)
            .first()
        )
        if request is None:
            continue

        risk = (request.risk_level or RISK_LOW).upper()
        if risk == RISK_HIGH:
            high_risk_count += 1
        elif risk == RISK_MEDIUM:
            medium_risk_count += 1
        else:
            low_risk_count += 1

        org_ids.append(request.club_id)

        # Count each HIGH-classified consented attribute
        consented: List[str] = log.consented_attrs or []
        for attr in consented:
            from privacy_engine import classify_field_risk
            if classify_field_risk(attr) == RISK_HIGH:
                high_attr_counter[attr] += 1

    unique_org_count = len(set(org_ids))

    # repeated_high_attr_count = number of distinct HIGH attrs shared > 1 time
    repeated_high_attr_count = sum(1 for cnt in high_attr_counter.values() if cnt > 1)

    # ── 4. Cumulative risk score ───────────────────────────────────────
    cumulative_risk_score = (
        high_risk_count * RISK_WEIGHTS[RISK_HIGH]
        + medium_risk_count * RISK_WEIGHTS[RISK_MEDIUM]
        + low_risk_count * RISK_WEIGHTS[RISK_LOW]
    )

    # ── 5. Exposure entropy (Shannon) over organiser distribution ──────
    exposure_entropy_score = _shannon_entropy(org_ids)

    # ── 6. Risk velocity — change vs. previous month ───────────────────
    prev_month = _previous_month(month)
    prev_metrics: Optional[models.StudentPrivacyMetrics] = (
        db.query(models.StudentPrivacyMetrics)
        .filter(
            models.StudentPrivacyMetrics.student_id == student_id,
            models.StudentPrivacyMetrics.month == prev_month,
        )
        .first()
    )
    prev_score = prev_metrics.cumulative_risk_score if prev_metrics else 0
    risk_velocity = float(cumulative_risk_score - prev_score)

    # ── 7. Upsert ──────────────────────────────────────────────────────
    existing: Optional[models.StudentPrivacyMetrics] = (
        db.query(models.StudentPrivacyMetrics)
        .filter(
            models.StudentPrivacyMetrics.student_id == student_id,
            models.StudentPrivacyMetrics.month == month,
        )
        .first()
    )

    if existing:
        existing.total_events = total_events
        existing.high_risk_count = high_risk_count
        existing.medium_risk_count = medium_risk_count
        existing.low_risk_count = low_risk_count
        existing.unique_org_count = unique_org_count
        existing.repeated_high_attr_count = repeated_high_attr_count
        existing.cumulative_risk_score = cumulative_risk_score
        existing.exposure_entropy_score = exposure_entropy_score
        existing.risk_velocity = risk_velocity
        existing.created_at = get_ist_now()
        metrics = existing
    else:
        metrics = models.StudentPrivacyMetrics(
            student_id=student_id,
            month=month,
            total_events=total_events,
            high_risk_count=high_risk_count,
            medium_risk_count=medium_risk_count,
            low_risk_count=low_risk_count,
            unique_org_count=unique_org_count,
            repeated_high_attr_count=repeated_high_attr_count,
            cumulative_risk_score=cumulative_risk_score,
            exposure_entropy_score=exposure_entropy_score,
            risk_velocity=risk_velocity,
        )
        db.add(metrics)

    db.commit()
    db.refresh(metrics)
    return metrics


# ── Rule-Based Advisor ─────────────────────────────────────────────────

def generate_rule_based_advice(
    metrics: models.StudentPrivacyMetrics,
) -> Dict:
    """
    Produce a deterministic privacy advisory from aggregated metrics.

    Returns
    -------
    dict
        ``{"risk_band": str, "flags": list[str], "recommendations": list[str]}``
    """

    flags: List[str] = []
    recommendations: List[str] = []

    # ── Determine risk band ────────────────────────────────────────────
    score = metrics.cumulative_risk_score
    if score >= 30:
        risk_band = "High"
    elif score >= 12:
        risk_band = "Moderate"
    else:
        risk_band = "Low"

    # ── Flag generation ────────────────────────────────────────────────
    if metrics.high_risk_count > 0:
        flags.append(
            f"You attended {metrics.high_risk_count} HIGH-risk event(s) this month."
        )
    if metrics.repeated_high_attr_count > 0:
        flags.append(
            f"{metrics.repeated_high_attr_count} sensitive attribute(s) were shared "
            f"with more than one organiser."
        )
    if metrics.risk_velocity > 0:
        flags.append(
            f"Your risk exposure increased by {metrics.risk_velocity:.0f} points "
            f"compared to last month."
        )
    if metrics.unique_org_count >= 4:
        flags.append(
            f"Data was shared with {metrics.unique_org_count} different organisers."
        )
    if metrics.exposure_entropy_score > 1.5:
        flags.append(
            "Your data is spread across many different organisers (high entropy)."
        )

    if not flags:
        flags.append("No significant privacy concerns detected this month. 🛡️")

    # ── Recommendation generation ──────────────────────────────────────
    if risk_band == "High":
        recommendations.append(
            "Consider reducing consent to HIGH-risk events unless absolutely necessary."
        )
        recommendations.append(
            "Review which organisers received sensitive attributes and request deletion if possible."
        )
    if metrics.repeated_high_attr_count > 0:
        recommendations.append(
            "Avoid sharing the same sensitive data (e.g. phone, ID) with multiple clubs."
        )
    if risk_band == "Moderate":
        recommendations.append(
            "Stay cautious — limit sharing personal details to trusted organisers only."
        )
    if metrics.risk_velocity > 10:
        recommendations.append(
            "Your risk is rising quickly. Pause and evaluate before consenting to more events."
        )
    if risk_band == "Low" and not recommendations:
        recommendations.append(
            "Great job! Keep reviewing event risk levels before sharing your data."
        )

    return {
        "risk_band": risk_band,
        "flags": flags,
        "recommendations": recommendations,
    }


# ── Helpers ────────────────────────────────────────────────────────────

def _shannon_entropy(items: List) -> float:
    """Compute Shannon entropy (base-2) over a list of categorical items."""
    if not items:
        return 0.0
    counter = Counter(items)
    total = len(items)
    entropy = 0.0
    for count in counter.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)
    return round(entropy, 4)


def _previous_month(month: str) -> str:
    """Return the YYYY-MM string for the month before *month*."""
    dt = datetime.strptime(month, "%Y-%m")
    if dt.month == 1:
        prev = dt.replace(year=dt.year - 1, month=12)
    else:
        prev = dt.replace(month=dt.month - 1)
    return prev.strftime("%Y-%m")
