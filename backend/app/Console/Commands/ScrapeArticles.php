<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ScrapeArticles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scrape:articles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting scrape...');
        $baseUrl = 'https://beyondchats.com/blogs/';

        $response = \Illuminate\Support\Facades\Http::withoutVerifying()->get($baseUrl);
        $crawler = new \Symfony\Component\DomCrawler\Crawler($response->body());

        // Find last page number (assumes .page-numbers class)
        $lastPage = 1;
        $pageLinks = $crawler->filter('.page-numbers');
        if ($pageLinks->count() > 0) {
            $pages = $pageLinks->each(function ($node) {
                return (int) $node->text();
            });
            $lastPage = max($pages);
        }
        $this->info("Last page found: $lastPage");

        // Collect articles from last page backwards until we have 5
        $allArticles = [];
        $currentPage = $lastPage;

        while (count($allArticles) < 5 && $currentPage >= 1) {
            if ($currentPage > 1) {
                $targetUrl = $baseUrl . 'page/' . $currentPage . '/';
            } else {
                $targetUrl = $baseUrl;
            }

            $this->info("Fetching: $targetUrl");
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()->get($targetUrl);
            $crawler = new \Symfony\Component\DomCrawler\Crawler($response->body());

            $pageArticles = $crawler->filter('article')->each(function ($node) {
                try {
                    $titleNode = $node->filter('h2 a')->first();
                    if ($titleNode->count() > 0) {
                        return [
                            'title' => $titleNode->text(),
                            'url' => $titleNode->attr('href')
                        ];
                    }
                    return null;
                } catch (\Exception $e) {
                    return null;
                }
            });

            $pageArticles = array_filter($pageArticles);

            // Add articles from this page to our collection
            foreach ($pageArticles as $article) {
                if (count($allArticles) < 5) {
                    $allArticles[] = $article;
                }
            }

            $currentPage--;
        }

        $this->info("Found " . count($allArticles) . " articles. detailed scraping...");

        foreach ($allArticles as $articleData) {
            $this->info("Scraping content for: " . $articleData['title']);

            try {
                $res = \Illuminate\Support\Facades\Http::withoutVerifying()->get($articleData['url']);
                $page = new \Symfony\Component\DomCrawler\Crawler($res->body());

                // Try .entry-content, fallback to others if needed
                $contentNode = $page->filter('.entry-content');
                if ($contentNode->count() == 0) {
                    $contentNode = $page->filter('article'); // fallback
                }

                $content = $contentNode->text();

                \App\Models\Article::updateOrCreate(
                    ['url' => $articleData['url']],
                    [
                        'title' => $articleData['title'],
                        'content' => $content
                    ]
                );
            } catch (\Exception $e) {
                $this->error("Failed to scrape " . $articleData['url'] . ": " . $e->getMessage());
            }
        }

        $this->info("Scraping completed.");
    }
}
