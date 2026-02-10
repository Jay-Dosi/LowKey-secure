import random

ADJECTIVES = [
    "silent", "ember", "cobalt", "lunar", "frost", "solar", "nebula", "zenith", "apex", "vertex",
    "nadir", "horizon", "vortex", "phantom", "specter", "shadow", "ghost", "wraith", "demon", "angel",
    "titan", "giant", "colossus", "beast", "monster", "creature", "cryptid", "alien", "mutant", "cyborg",
    "android", "robot", "mech", "drone", "clone", "synthetic", "organic", "bio", "techno", "electro",
    "pyro", "cryo", "geo", "hydro", "anemo", "dendro", "light", "dark", "chaos", "order",
    "law", "truth", "justice", "honor", "glory", "power", "might", "magic", "mana", "soul",
    "spirit", "essence", "aura", "chi", "ki", "chakra", "energy", "force", "velocity", "momentum",
    "inertia", "gravity", "mass", "matter", "plasma", "fusion", "fission", "atomic", "molecular",
    "viral", "bacterial", "fungal", "parasitic", "symbiotic", "mutual", "predatory", "hunter",
    "swift", "rapid", "calm", "brave", "bold", "wise", "keen", "alert", "steady", "loyal"
]

NOUNS = [
    "orbit", "harbor", "drift", "anchor", "vector", "signal", "pilot", "scout", "ranger", "walker",
    "runner", "flyer", "driver", "rider", "sailor", "diver", "climber", "hiker", "racer", "player",
    "gamer", "coder", "hacker", "maker", "builder", "creater", "artist", "writer", "poet", "bard",
    "sage", "wizard", "witch", "mage", "priest", "monk", "rogue", "thief", "ninja", "samurai",
    "knight", "squire", "page", "king", "queen", "prince", "duke", "lord", "lady", "baron",
    "chief", "boss", "leader", "guide", "coach", "mentor", "tutor", "teacher", "student", "pupil",
    "tiger", "lion", "wolf", "bear", "fox", "hawk", "eagle", "owl", "crow", "raven",
    "snake", "viper", "cobra", "shark", "whale", "dolphin", "seal", "otter", "beaver", "badger"
]

def generate_random_username(role: str = None) -> str:
    """
    Generates a unique random username in the format:
    adjective-noun (e.g., silent-orbit)
    
    Args:
        role: Ignored, kept for compatibility. Prefixes are REMOVED.
    """
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    
    # Simple adj-noun format
    base_name = f"{adj}-{noun}"
    
    # 20% chance to add a small number for entropy if desired, 
    # but the prompt asked for "If collision occurs... optionally append suffix".
    # For the base generator, we'll stick to word-word to match the "silent-orbit" style.
    # We will let the caller handle collision retry or we can just return this.
    
    return base_name

if __name__ == "__main__":
    # Test generation
    print(generate_random_username())
    print(generate_random_username())

