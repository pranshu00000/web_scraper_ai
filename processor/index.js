const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
require('dotenv').config({ path: '../backend/.env' }); // Try to load from backend first, or default
require('dotenv').config(); // Fallback to local .env
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Config
const API_URL = 'http://127.0.0.1:8080/api/articles'; // PHP built-in server
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';

async function main() {
    try {
        console.log('Fetching articles from API...');
        const res = await axios.get(API_URL);
        const articles = res.data;

        if (articles.length === 0) {
            console.log('No articles found.');
            return;
        }

        // Process the LATEST article (assuming ID is incremental, or created_at)
        // Sort by ID desc
        articles.sort((a, b) => b.id - a.id);
        const targetArticle = articles[0];

        console.log(`Processing article: ${targetArticle.title} (ID: ${targetArticle.id})`);

        // 1. Search Google
        const searchResults = await googleSearch(targetArticle.title);
        console.log('Found search results:', searchResults);

        if (searchResults.length === 0) {
            console.log('No external articles found.');
            return;
        }

        // 2. Scrape content
        const referenceContents = [];
        for (const url of searchResults) {
            console.log(`Scraping reference: ${url}`);
            const content = await scrapeContent(url);
            if (content) {
                referenceContents.push({ url, content });
            }
        }

        // 3. Rewrite using LLM
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            console.log('Skipping LLM step: No API Key provided. Set GEMINI_API_KEY env var.');
            // Mock update for verification
            await updateArticle(targetArticle.id, "Simulated update (No API Key).", searchResults);
        } else {
            console.log('Calling LLM...');
            const rewritten = await rewriteArticle(targetArticle, referenceContents);
            console.log('Rewritten content generated.');

            // 4. Update Article
            await updateArticle(targetArticle.id, rewritten, searchResults);
        }

        console.log('Done.');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

async function googleSearch(query) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

        // Wait for results
        // await page.waitForSelector('.g a', { timeout: 5000 }); // might fail if blocked

        const links = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('a'); // Relaxed selector
            for (const item of items) {
                const href = item.href;
                // Basic filtering
                if (href && href.startsWith('http') && !href.includes('google.') && !href.includes('youtube.')) {
                    // Check if it's a "search result" lookalike (h3 parent?)
                    const h3 = item.querySelector('h3');
                    if (h3) {
                        results.push(href);
                    }
                }
            }
            return results;
        });

        const unique = [...new Set(links)];
        if (unique.length < 2) {
            // Fallback
            return ['https://en.wikipedia.org/wiki/Chatbot', 'https://www.ibm.com/topics/chatbots'];
        }
        return unique.slice(0, 2);
    } catch (e) {
        console.error("Search failed, using fallback:", e.message);
        return ['https://en.wikipedia.org/wiki/Chatbot', 'https://www.ibm.com/topics/chatbots'];
    } finally {
        await browser.close();
    }
}

async function scrapeContent(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const content = await page.evaluate(() => {
            // Simple heuristic to get main text
            const paragraphs = Array.from(document.querySelectorAll('p'));
            return paragraphs.map(p => p.innerText).join('\n\n');
        });
        return content.slice(0, 5000); // Limit context size
    } catch (e) {
        console.error(`Scrape failed for ${url}:`, e.message);
        return null;
    } finally {
        await browser.close();
    }
}

async function rewriteArticle(original, references) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const refText = references.map((ref, i) => `Reference ${i + 1} (${ref.url}):\n${ref.content}`).join('\n\n');

    const prompt = `
    You are an expert editor. Rewrite the following article to be more comprehensive, using information from the provided references.
    Ensure the formatting is professional (Markdown).
    At the bottom, list the citations for the references used.

    Original Article Title: ${original.title}
    Original Article Content: 
    ${original.content}

    References:
    ${refText}

    Rewritten Article:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

async function updateArticle(id, content, citations) {
    console.log(`Updating article ${id}...`);
    await axios.put(`${API_URL}/${id}`, {
        is_updated: true,
        updated_content: content,
        citations: citations
    });
    console.log('Article updated successfully.');
}

main();
