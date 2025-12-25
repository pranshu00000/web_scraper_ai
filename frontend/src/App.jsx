import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:8080/api/articles';

function App() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [viewMode, setViewMode] = useState('updated'); // 'original' or 'updated'

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await axios.get(API_URL);
      setArticles(res.data);
    } catch (err) {
      console.error("Failed to fetch articles", err);
    }
  };

  const handleRead = (article) => {
    setSelectedArticle(article);
    setViewMode(article.is_updated ? 'updated' : 'original');
  };

  const handleClose = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>BeyondChats Blog Reader</h1>
      </header>

      <main className="grid">
        {articles.map(article => (
          <div key={article.id} className="card" onClick={() => handleRead(article)}>
            <h3>{article.title}</h3>
            <p>{article.content.substring(0, 100)}...</p>
            <span className="badge">{article.is_updated ? 'Updated with AI' : 'Original'}</span>
          </div>
        ))}
      </main>

      {selectedArticle && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={handleClose}>&times;</button>
            
            <h2>{selectedArticle.title}</h2>
            
            {selectedArticle.is_updated && (
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${viewMode === 'original' ? 'active' : ''}`}
                  onClick={() => setViewMode('original')}
                >
                  Original
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'updated' ? 'active' : ''}`}
                  onClick={() => setViewMode('updated')}
                >
                  Updated (AI)
                </button>
              </div>
            )}

            <div className="article-body">
              {viewMode === 'updated' && selectedArticle.is_updated ? (
                <>
                  <div className="content" dangerouslySetInnerHTML={{ __html: formatContent(selectedArticle.updated_content) }} />
                  {selectedArticle.citations && (
                    <div className="citations">
                      <h4>References</h4>
                      <ul>
                        {Array.isArray(selectedArticle.citations) ? selectedArticle.citations.map((c, i) => (
                          <li key={i}><a href={c} target="_blank" rel="noreferrer">{c}</a></li>
                        )) : (
                          // Handle stringified or various formats if needed
                           <li>{JSON.stringify(selectedArticle.citations)}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="content" dangerouslySetInnerHTML={{ __html: formatContent(selectedArticle.content) }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple formatter for newlines to <br> if not using Markdown renderer
function formatContent(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br />'); // Basic conversion
}

export default App;
