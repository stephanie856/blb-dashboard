"""
Book Chapter Reddit Analysis Tool (Final Polish - Clean Wordclouds)
Uses google-genai SDK and Gemini 3 Pro
"""

import os
import json
import praw
import sys
import warnings
from datetime import datetime
from pathlib import Path
from wordcloud import WordCloud, STOPWORDS
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. SETUP & SAFETY CHECKS
sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()

if not os.getenv("REDDIT_CLIENT_ID") or not os.getenv("GOOGLE_API_KEY"):
    print("\n❌ CRITICAL ERROR: API Keys are missing.")
    sys.exit(1)

# Configuration
SUBREDDITS = ["ADHDwomen", "neurodiversity", "ADHD", "AutismInWomen", "autism", "Alexithymia", "ADHDers"]
TIME_FILTER = "year"
MAX_POSTS_PER_THEME = 500
MODEL_ID = "gemini-3-pro-preview" 

# ---------------------------------------------------------
# PREDEFINED THEMES DICTIONARY
# ---------------------------------------------------------
PREDEFINED_THEMES = {
    "masking": {
        "search_terms": ["masking", "hiding myself", "pretending", "fake personality", "code switching"],
        "description": "Suppressing authentic traits to appear neurotypical/acceptable"
    },
    "invisibility": {
        "search_terms": ["invisible", "overlooked", "forgotten", "ignored", "unseen"],
        "description": "Being overlooked or treated as non-essential despite being present"
    },
    "shapeshifting": {
        "search_terms": ["chameleon", "changing personality", "different person", "adapting constantly"],
        "description": "Constantly changing behavior based on environment or audience"
    },
    "alexithymia": {
        "search_terms": ["alexithymia", "can't name feelings", "don't know what I feel", "emotional confusion"],
        "description": "Difficulty identifying and describing one's own emotions"
    },
    "dissociation": {
        "search_terms": ["dissociation", "zoning out", "disconnected", "autopilot", "out of body"],
        "description": "Emotional detachment or feeling disconnected from experiences"
    },
    "back-burner": {
        "search_terms": ["backup plan", "second choice", "not priority", "kept waiting", "almost chosen"],
        "description": "Being kept as an option but never chosen as a priority"
    },
    "add-on friend": {
        "search_terms": ["afterthought friend", "forgot to invite", "last minute add", "group chat forgot me"],
        "description": "Being included as an afterthought rather than intentionally"
    },
    "peoplepleasing": {
        "search_terms": ["people pleasing", "can't say no", "always accommodating", "prioritize others"],
        "description": "Prioritizing others' comfort at expense of own authenticity"
    },
    "hypervigilance": {
        "search_terms": ["hypervigilant", "always scanning", "waiting for rejection", "reading into everything"],
        "description": "Constant scanning for social threats or misinterpretation"
    },
    "misinterpretation": {
        "search_terms": ["misunderstood", "they took it wrong", "didn't mean it that way", "clarifying constantly"],
        "description": "Being frequently misunderstood despite clear communication"
    },
    "burnout": {
        "search_terms": ["burnout", "exhausted", "can't keep up", "running on empty", "autistic burnout"],
        "description": "Exhaustion from sustained masking or overextension"
    },
    "ahedonia": {
        "search_terms": ["ahedonia", "no joy", "nothing feels good", "can't enjoy things", "emotional numbness"],
        "description": "Inability to experience pleasure from previously enjoyable activities"
    },
    "functional-freeze": {
        "search_terms": ["functional freeze", "surviving not living", "autopilot", "going through motions"],
        "description": "Appearing functional while emotionally/mentally shut down"
    },
    "RSD": {
        "search_terms": ["RSD", "rejection sensitive dysphoria", "criticism hurts", "rejection pain"],
        "description": "Extreme emotional pain from perceived rejection or criticism"
    },
    "stillness-paralysis": {
        "search_terms": ["paralyzed", "can't move", "frozen", "too scared to act", "shutdown"],
        "description": "Inability to act due to fear of negative consequences"
    },
    "ADHD": {
        "search_terms": ["ADHD", "attention deficit", "executive dysfunction", "can't focus", "dopamine seeking"],
        "description": "Attention regulation challenges and executive dysfunction"
    },
    "executive-dysfunction": {
        "search_terms": ["executive dysfunction", "can't start tasks", "poor time management", "organization problems"],
        "description": "Difficulty with task initiation, planning, and completion"
    },
    "overstimulation": {
        "search_terms": ["overstimulated", "sensory overload", "too much input", "need quiet", "overwhelmed"],
        "description": "Sensory/emotional overwhelm from environmental input"
    },
    "task-paralysis": {
        "search_terms": ["task paralysis", "can't start", "procrastination paralysis", "knowing but not doing"],
        "description": "Inability to start tasks despite urgency"
    },
    "marginalization": {
        "search_terms": ["marginalized", "excluded", "othered", "discrimination", "not included"],
        "description": "Exclusion due to intersecting identities"
    },
    "microaggressions": {
        "search_terms": ["microaggression", "subtle racism", "casual discrimination", "backhanded compliment"],
        "description": "Subtle discriminatory comments or actions"
    },
    "code-switching": {
        "search_terms": ["code switching", "switching accents", "professional voice", "cultural masking"],
        "description": "Adjusting behavior based on racial/cultural context"
    },
    "imposter-syndrome": {
        "search_terms": ["imposter syndrome", "don't deserve it", "fraud feeling", "not good enough"],
        "description": "Persistent self-doubt despite evidence of competence"
    },
    "othering": {
        "search_terms": ["othering", "not one of us", "different", "outsider", "don't belong"],
        "description": "Being treated as fundamentally different"
    }
}

# Initialize Clients
reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT")
)
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# Output setup
for d in ["analyses", "wordclouds", "csvs"]:
    Path(f"output/{d}").mkdir(parents=True, exist_ok=True)

def extract_themes(chapter_text, chapter_number):
    print(f"\n📖 Analyzing Chapter {chapter_number} with {MODEL_ID}...")
    
    menu = "\n".join([f"- {key}: {val['description']}" for key, val in PREDEFINED_THEMES.items()])
    
    prompt = f"""Analyze this chapter and select the top 3 themes from the list below that are MOST PRESENT.
    AVAILABLE THEMES:
    {menu}
    CHAPTER TEXT (truncated):
    {chapter_text[:30000]}
    INSTRUCTIONS:
    - Return ONLY a JSON array of strings containing the exact theme names.
    - Example: ["masking", "burnout", "RSD"]
    - Do NOT invent new themes. Choose only from the list.
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        selected_names = json.loads(response.text)
        
        final_themes = []
        print(f"✅ Gemini selected {len(selected_names)} themes:")
        
        for name in selected_names:
            if name in PREDEFINED_THEMES:
                print(f"   - {name}")
                final_themes.append({
                    "name": name,
                    "description": PREDEFINED_THEMES[name]["description"],
                    "search_terms": PREDEFINED_THEMES[name]["search_terms"]
                })
            else:
                print(f"   ⚠️ Warning: Gemini hallucinated theme '{name}' - ignoring.")
                
        return final_themes

    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return []

def search_reddit_for_theme(theme):
    print(f"\n🔍 Searching Reddit for: {theme['name']}")
    all_posts = []
    by_subreddit = {}
    
    for sub in SUBREDDITS:
        print(f"   Searching r/{sub}...", end=" ")
        try:
            subreddit = reddit.subreddit(sub)
            count = 0
            query = " OR ".join(theme['search_terms'])
            
            for post in subreddit.search(query, time_filter=TIME_FILTER, limit=100):
                if post.selftext in ["[deleted]", "[removed]", ""]: continue
                
                all_posts.append({
                    "title": post.title,
                    "text": post.selftext[:1000],
                    "upvotes": post.score,
                    "subreddit": sub,
                    "url": f"https://reddit.com{post.permalink}"
                })
                count += 1
                if count >= MAX_POSTS_PER_THEME // len(SUBREDDITS): break
            
            by_subreddit[sub] = count
            print(f"{count} posts")
        except Exception as e:
            print(f"Err: {e}")
            
    return all_posts, by_subreddit

def analyze_sentiment(posts):
    print(f"\n🎭 Analyzing sentiment for {len(posts)} posts...")
    if not posts: return {}

    # Initialize sentiment
    for p in posts:
        p['sentiment'] = "Error/Skipped"

    results = {"Inspirational": 0, "Fed Up": 0, "Seeking Advice": 0, "Supportive": 0, "Neutral": 0}
    BATCH_SIZE = 50
    
    for i in range(0, len(posts), BATCH_SIZE):
        batch = posts[i : i + BATCH_SIZE]
        print(f"   Processing batch {i}-{i+len(batch)}...", end="\r")
        
        lines = []
        for idx, p in enumerate(batch):
            clean_title = p['title'].replace('\n', ' ')
            clean_text = p['text'][:150].replace('\n', ' ')
            lines.append(f"ID {idx}: {clean_title} - {clean_text}")
        
        posts_text = "\n".join(lines)
        
        prompt = f"""Classify these Reddit posts into ONE category:
        - Inspirational
        - Fed Up
        - Seeking Advice
        - Supportive
        - Neutral
        Posts:
        {posts_text}
        Return ONLY JSON: {{"0": "Fed Up", "1": "Supportive"}}"""

        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            mapping = json.loads(response.text)
            
            for key, category in mapping.items():
                cat_clean = category.title()
                if cat_clean not in results: cat_clean = "Neutral"
                results[cat_clean] += 1
                local_idx = int(key)
                if local_idx < len(batch):
                    batch[local_idx]['sentiment'] = cat_clean
                    
        except Exception as e:
            print(f"   ❌ Batch Error: {e}")

    print(f"   Breakdown (All {len(posts)} posts): {results}")
    return results

def extract_quotes(posts, theme_name):
    print(f"\n💬 Extracting quotes...")
    top_posts = sorted(posts, key=lambda x: x['upvotes'], reverse=True)[:50]
    lines = []
    for p in top_posts:
        lines.append(f"{p['title']} {p['text'][:300]}")
    text_dump = "\n".join(lines)
    
    prompt = f"""Extract 5 powerful, anonymous quotes about '{theme_name}' from this text.
    Remove usernames. Make them standalone.
    Text: {text_dump}
    Return ONLY a JSON array of strings."""
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        quotes = json.loads(response.text)
        for q in quotes: 
            print(f"   - {q[:60]}...")
        return quotes
    except Exception as e:
        print(f"❌ Quote Error: {e}")
        return []

def generate_wordcloud(posts, theme_name, chapter_num):
    if not posts: return
    text_list = [f"{p['title']} {p['text']}" for p in posts]
    text = " ".join(text_list)

    # --- CUSTOM STOPWORDS (NOISE FILTER) ---
    custom_stopwords = set(STOPWORDS)
    custom_stopwords.update([
        "going", "said", "say", "week", "day", "thing", "things", 
        "actually", "really", "literally", "think", "know", "feel", 
        "much", "even", "though", "will", "want", "make", "people",
        "time", "year", "years", "got", "now", "one", "didn", "don",
        "something", "anything", "back", "see", "way", "still", "good",
        "need", "never", "always"
    ])
    
    wc = WordCloud(
        width=1200, 
        height=800, 
        background_color='white',
        stopwords=custom_stopwords,  # Apply filter
        min_word_length=3            # Skip tiny words like "is", "at"
    ).generate(text)
    
    filename = f"chapter_{chapter_num}_{theme_name.replace(' ', '_')}.png"
    path = f"output/wordclouds/{filename}"
    wc.to_file(path)
    return f"/wordclouds/{filename}"

def save_csv(posts, theme_name, chapter_num):
    import csv
    filename = f"chapter_{chapter_num}_{theme_name.replace(' ', '_')}.csv"
    path = f"output/csvs/{filename}"
    if posts:
        with open(path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=posts[0].keys())
            writer.writeheader()
            writer.writerows(posts)
    return filename

def analyze_chapter(file_path, num):
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f: 
        text = f.read()
    
    themes = extract_themes(text, num)
    
    final_data = {
        "metadata": {
            "chapter_number": int(num),
            "analyzed_at": datetime.now().isoformat(),
            "analysis_id": f"chapter_{num}_{int(datetime.now().timestamp())}",
            "time_filter": TIME_FILTER,
            "subreddits": SUBREDDITS
        },
        "themes": []
    }
    
    for theme in themes:
        posts, subs = search_reddit_for_theme(theme)
        if not posts: 
            print("   No posts found.")
            continue
        
        sentiment_data = analyze_sentiment(posts)
        quotes_data = extract_quotes(posts, theme['name'])
        wc_web_path = generate_wordcloud(posts, theme['name'], num)
        csv_filename = save_csv(posts, theme['name'], num)
        
        top_posts = sorted(posts, key=lambda x: x['upvotes'], reverse=True)[:3]
        
        theme_entry = {
            "name": theme['name'],
            "description": theme['description'],
            "total_posts": len(posts),
            "by_subreddit": subs,
            "sentiment_breakdown": sentiment_data,
            "top_posts": top_posts,
            "quotes": quotes_data,
            "wordcloud_path": wc_web_path,
            "csv_filename": csv_filename
        }
        
        final_data["themes"].append(theme_entry)

    out_path = f"output/analyses/chapter_{num}.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
    print(f"\n✅ Done. Saved to {out_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python analyze_chapter.py <file> <chapter_num>")
        sys.exit(1)
    analyze_chapter(sys.argv[1], sys.argv[2])