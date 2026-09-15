import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { CoverArt, Empty, InfoTip } from "../components/ui.jsx";
import { IconAlert, IconBook } from "../components/icons.jsx";

function relativeDate(ts) {
  if (!ts) return null;
  const days = Math.floor((Date.now() / 1000 - ts) / 86400);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function BookCard({ book, navigate }) {
  const words = book.total_words || 0;
  const wordLabel = words >= 1000 ? `${(words / 1000).toFixed(1)}k words` : `${words} words`;
  const published = book.published_through;

  return (
    <div className="book-card">
      {/* The whole card is one link; the Read button is a second, nested
          action, so it sits outside the anchor rather than inside it. */}
      <a
        className="book-card-main"
        href={`#/b/${encodeURIComponent(book.name)}/overview`}
        onClick={(e) => {
          e.preventDefault();
          navigate({ view: "book", project: book.name, section: "overview" });
        }}
      >
        <CoverArt title={book.name} genre={book.genre} />
        <div className="book-card-body">
          <h3 className="book-card-title">{book.name}</h3>
          <div className="book-card-meta">
            <span>{book.chapter_count} ch</span>
            <span aria-hidden="true">·</span>
            <span>{wordLabel}</span>
          </div>
          <div className="book-card-tags">
            {book.project_type && (
              <span className="chip">
                {book.project_type === "web-novel" ? "Web novel" : "Book"}
              </span>
            )}
            {book.length_tier && book.length_tier !== "n-a" && (
              <span className="chip is-quiet">{book.length_tier}</span>
            )}
          </div>
          <div className="book-card-foot">
            {published ? (
              <span className="dot-label is-ok">Published thru {published}</span>
            ) : (
              <span className="dot-label is-quiet">Unpublished</span>
            )}
            {book.last_activity && (
              <span className="book-card-when">{relativeDate(book.last_activity)}</span>
            )}
          </div>
        </div>
      </a>

      <button
        type="button"
        className="btn btn-ghost book-card-read"
        onClick={() => navigate({ view: "reader", project: book.name })}
        disabled={book.chapter_count === 0}
      >
        <IconBook width={14} height={14} />
        {book.chapter_count === 0 ? "No chapters yet" : "Read"}
      </button>
    </div>
  );
}

export default function Library({ navigate }) {
  const [books, setBooks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.library().then(setBooks).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="error-banner" role="alert">
        <IconAlert />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="library">
      <header className="library-head">
        <div>
          <h1 className="page-title">Library</h1>
          <p className="page-sub">
            Every project in this workspace. Open one for its dashboard, or jump
            straight into reading.
            <InfoTip label="Library">
              Reads <code>projects/</code> in your workspace. Covers are generated
              from each title — book-forge produces a cover <em>brief</em> (text art
              direction via <code>/book-forge:book-cover</code>), never an image, so
              there's no artwork to display here.
            </InfoTip>
          </p>
        </div>
      </header>

      {books === null && (
        <div className="book-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
          ))}
          <span className="visually-hidden" role="status">Loading library</span>
        </div>
      )}

      {books && books.length === 0 && (
        <Empty>
          No projects yet. Run <code>/book-forge:book</code> in Claude Code to start
          one, then reload this page.
        </Empty>
      )}

      {books && books.length > 0 && (
        <div className="book-grid">
          {books.map((b) => (
            <BookCard key={b.name} book={b} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}
