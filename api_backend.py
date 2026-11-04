#!/usr/bin/env python3
import sys
import os
import json
import urllib.request
import urllib.parse
import urllib.error

def query_gemini(query, api_key):
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{
                "parts": [{"text": f"Siz CIPHER AI tadqiqot yordamchisiz (ai.google.dev). Quyidagi so'rov bo'yicha batafsil o'zbekcha tahlil tayyorlang:\n{query}"}]
            }]
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            return res_data['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        return f"Gemini (ai.google.dev) API xatoligi: {str(e)}"

def query_tavily(query, api_key):
    try:
        url = "https://api.tavily.com/search"
        headers = {"Content-Type": "application/json"}
        data = {
            "api_key": api_key,
            "query": query,
            "search_depth": "advanced",
            "include_answer": True
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            answer = res_data.get("answer", "")
            results = res_data.get("results", [])
            
            out = []
            if answer:
                out.append(f"**Tavily Javobi:**\n{answer}\n")
            
            if results:
                out.append("**Manbalar:**")
                for idx, r in enumerate(results[:5], 1):
                    out.append(f"{idx}. [{r.get('title')}]({r.get('url')})\n   {r.get('content')}")
            
            return "\n\n".join(out) if out else "Tavily qidiruvi bo'yicha natijalar topilmadi."
    except Exception as e:
        return f"Tavily (tavily.com) API xatoligi: {str(e)}"

def query_serpapi(query, api_key):
    try:
        encoded_q = urllib.parse.quote(query)
        url = f"https://serpapi.com/search.json?q={encoded_q}&api_key={api_key}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            organic = res_data.get("organic_results", [])
            if not organic:
                return "SerpAPI natijalari topilmadi."
            out = ["**SerpAPI Google Qidiruv Natijalari:**\n"]
            for idx, item in enumerate(organic[:5], 1):
                out.append(f"{idx}. **[{item.get('title')}]({item.get('link')})**\n   {item.get('snippet', '')}")
            return "\n\n".join(out)
    except Exception as e:
        return f"SerpAPI (serpapi.com) API xatoligi: {str(e)}"

def query_exa(query, api_key):
    try:
        url = "https://api.exa.ai/search"
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        data = {
            "query": query,
            "numResults": 5,
            "useAutoprompt": True
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            results = res_data.get("results", [])
            if not results:
                return "Exa AI natijalari topilmadi."
            out = ["**Exa Neural Search Natijalari:**\n"]
            for idx, r in enumerate(results, 1):
                out.append(f"{idx}. **[{r.get('title', 'Link')}]({r.get('url')})**\n   Score: {r.get('score', 'N/A')}")
            return "\n\n".join(out)
    except Exception as e:
        return f"Exa (exa.ai) API xatoligi: {str(e)}"

def query_firecrawl(query, api_key):
    try:
        url = "https://api.firecrawl.dev/v1/search"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "query": query,
            "limit": 5
        }
        req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            items = res_data.get("data", [])
            if not items:
                return "Firecrawl qidiruvi bo'yicha natijalar topilmadi."
            out = ["**Firecrawl Web Crawl Natijalari:**\n"]
            for idx, item in enumerate(items, 1):
                title = item.get('title') or item.get('metadata', {}).get('title') or 'Veb-sahifa'
                url_link = item.get('url') or item.get('metadata', {}).get('sourceURL') or '#'
                desc = item.get('description') or item.get('markdown', '')[:200]
                out.append(f"{idx}. **[{title}]({url_link})**\n   {desc}")
            return "\n\n".join(out)
    except Exception as e:
        return f"Firecrawl (firecrawl.dev) API xatoligi: {str(e)}"

def main():
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read()

    try:
        params = json.loads(raw_input)
    except Exception:
        params = {"query": raw_input, "engine": "all"}

    query = params.get("query", "").strip()
    engine = params.get("engine", "all").lower()

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    serpapi_key = os.environ.get("SERPAPI_API_KEY", "")
    exa_key = os.environ.get("EXA_API_KEY", "")
    firecrawl_key = os.environ.get("FIRECRAWL_API_KEY", "")

    result_text = ""

    if engine == "tavily":
        if tavily_key:
            result_text = query_tavily(query, tavily_key)
        else:
            result_text = "⚠️ **Tavily API Key topilmadi.** `.env` fayliga `TAVILY_API_KEY` qiymatini kiritishingiz lozim."
    elif engine == "serpapi":
        if serpapi_key:
            result_text = query_serpapi(query, serpapi_key)
        else:
            result_text = "⚠️ **SerpAPI Key topilmadi.** `.env` fayliga `SERPAPI_API_KEY` qiymatini kiritishingiz lozim."
    elif engine == "gemini":
        if gemini_key:
            result_text = query_gemini(query, gemini_key)
        else:
            result_text = "⚠️ **Gemini API Key topilmadi.** `.env` fayliga `GEMINI_API_KEY` qiymatini kiritishingiz lozim."
    elif engine == "exa":
        if exa_key:
            result_text = query_exa(query, exa_key)
        else:
            result_text = "⚠️ **Exa API Key topilmadi.** `.env` fayliga `EXA_API_KEY` qiymatini kiritishingiz lozim."
    elif engine == "firecrawl":
        if firecrawl_key:
            result_text = query_firecrawl(query, firecrawl_key)
        else:
            result_text = "⚠️ **Firecrawl API Key topilmadi.** `.env` fayliga `FIRECRAWL_API_KEY` qiymatini kiritishingiz lozim."
    else:
        # ALL / AUTO engine mode
        results = []
        if tavily_key:
            results.append(f"### 🌐 Tavily (tavily.com)\n{query_tavily(query, tavily_key)}")
        if serpapi_key:
            results.append(f"### 🔍 SerpAPI (serpapi.com)\n{query_serpapi(query, serpapi_key)}")
        if gemini_key:
            results.append(f"### ✨ Google Gemini (ai.google.dev)\n{query_gemini(query, gemini_key)}")
        if exa_key:
            results.append(f"### ⚡ Exa AI (exa.ai)\n{query_exa(query, exa_key)}")
        if firecrawl_key:
            results.append(f"### 🔥 Firecrawl (firecrawl.dev)\n{query_firecrawl(query, firecrawl_key)}")

        if results:
            result_text = "\n\n---\n\n".join(results)
        else:
            # Fallback if no keys set yet
            result_text = (
                f"### 🌐 CIPHER Qidiruv Tizimi (Natija)\n\n"
                f"So'rov: **\"{query}\"**\n\n"
                f"API kalitlar ro'yxati (Sozlamalar):\n"
                f"- **Tavily (tavily.com)**: `TAVILY_API_KEY`\n"
                f"- **SerpAPI (serpapi.com)**: `SERPAPI_API_KEY`\n"
                f"- **Google Gemini (ai.google.dev)**: `GEMINI_API_KEY`\n"
                f"- **Exa AI (exa.ai)**: `EXA_API_KEY`\n"
                f"- **Firecrawl (firecrawl.dev)**: `FIRECRAWL_API_KEY`\n\n"
                f"*Jonli qidiruv natijalarini olish uchun atigi bitta yoki barcha kalitlarni o'rnating.*"
            )

    print(json.dumps({"text": result_text, "engine": engine}))

if __name__ == "__main__":
    main()
