'use client'

import React, { useEffect, useState } from 'react'

const NODES = [
  'http://localhost:8000',
  'http://localhost:8001',
  'http://localhost:8002',
];

export default function Home() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ totalFiles: number, totalBytes: number, quotaBytes: number } | null>(null);
  const [replicaStatus, setReplicaStatus] = useState<Record<string, boolean>>({});
  const [leaderName, setLeaderName] = useState<string>('Loading...');
  const [leaderURL, setLeaderURL] = useState<string>('');

  const [clocks, setClocks] = useState([
    { node: 'A', clock: 0 },
    { node: 'B', clock: 0 }
  ]);

  useEffect(() => {
    checkReplicas();
    findLeader();

    const interval = setInterval(() => {
      checkReplicas();
      findLeader();
    }, 5000);

    const tick = setInterval(() => {
      setClocks(prev => prev.map(c => ({ ...c, clock: c.clock + 1 })));
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (leaderURL) {
      fetchFiles();
      fetchStats();
    }
  }, [leaderURL]);

  const findLeader = async () => {
    for (const node of NODES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(node + "/leader", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text.includes(node.replace('http://localhost:', ''))) {
            setLeaderURL(node);
          }
          setLeaderName(text);
          return;
        }
      } catch (err) {
        console.warn(`❌ Failed to fetch leader from ${node}`);
      }
    }
    setLeaderName('Unknown');
  };

  const fetchFiles = async () => {
    if (!leaderURL) return;
    try {
      const res = await fetch(`${leaderURL}/files`);
      const data = await res.json();
      setFiles(data || []);
    } catch (err) {
      console.error('❌ Failed to fetch files', err);
      setFiles([]);
    }
  };

  const fetchStats = async () => {
    if (!leaderURL) return;
    try {
      const res = await fetch(`${leaderURL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('❌ Failed to fetch stats', err);
      setStats(null);
    }
  };

  const checkReplicas = async () => {
    const status: Record<string, boolean> = {};
    for (const url of NODES) {
      try {
        const res = await fetch(`${url}/health`);
        status[url] = res.ok;
      } catch {
        status[url] = false;
      }
    }
    setReplicaStatus(status);
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file');
    if (!leaderURL) return alert('No leader available');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${leaderURL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        alert('✅ File uploaded');
        fetchFiles();
        fetchStats();
      } else {
        alert('❌ Upload failed');
      }
    } catch (err) {
      alert('❌ Upload error');
      console.error(err);
    }
  };

  const handleDownload = (filename: string) => {
    if (!leaderURL) return;
    window.open(`${leaderURL}/download?name=${filename}`, '_blank');
  };

  const handleDelete = async (filename: string) => {
    if (!leaderURL) return;
    try {
      const res = await fetch(`${leaderURL}/delete?name=${filename}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFiles();
        fetchStats();
      }
    } catch (err) {
      console.error('❌ Failed to delete file', err);
    }
  };

  const sendMessage = (from: string, to: string) => {
    setClocks(prev => {
      const fromClock = prev.find(c => c.node === from)?.clock ?? 0;
      return prev.map(c => {
        if (c.node === to) {
          return { ...c, clock: Math.max(c.clock, fromClock) + 1 };
        }
        return c;
      });
    });
  };

  return (
    <main style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
      background: '#fafafa'
    }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center' }}>
        📁 Distributed File System
      </h1>

      {/* Leader Info */}
      <section style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: '#e8f5e9',
        border: '1px solid #c8e6c9',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <strong>👑 Current Leader:</strong> {leaderName}
      </section>

      {/* Upload */}
      <section style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2>📤 Upload File</h2>
        <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
        <button
          onClick={handleUpload}
          style={{
            marginLeft: '1rem',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Upload
        </button>
      </section>

      {/* Storage Usage */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>📦 Storage Usage</h2>
        {stats ? (
          <div style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: '6px',
            boxShadow: '0 0 8px rgba(0,0,0,0.1)'
          }}>
            <p>Total Files: {stats.totalFiles}</p>
            <p>Used: {(stats.totalBytes / 1024 / 1024).toFixed(2)} MB / {(stats.quotaBytes / 1024 / 1024)} MB</p>
            <div style={{
              background: '#ccc',
              height: '10px',
              borderRadius: '5px',
              marginTop: '0.5rem'
            }}>
              <div style={{
                width: `${(stats.totalBytes / stats.quotaBytes) * 100}%`,
                height: '10px',
                background: '#4caf50',
                borderRadius: '5px'
              }} />
            </div>
          </div>
        ) : <p>Loading stats...</p>}
      </section>

      {/* Replica Status */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>🔁 Replica Status</h2>
        <ul>
          {Object.entries(replicaStatus).map(([url, alive]) => (
            <li key={url} style={{
              color: alive ? 'green' : 'red',
              marginBottom: '0.5rem'
            }}>
              {url}: {alive ? '✅ ALIVE' : '❌ OFFLINE'}
            </li>
          ))}
        </ul>
      </section>

      {/* File List */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>📄 Available Files</h2>
        {files.length === 0 ? (
          <p>No files found.</p>
        ) : (
          <ul style={{ padding: 0 }}>
            {files.map(file => (
              <li key={file} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
                padding: '0.5rem 0'
              }}>
                <span>{file}</span>
                <span>
                  <button onClick={() => handleDownload(file)} style={{
                    marginRight: '1rem',
                    background: '#2196f3',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    Download
                  </button>
                  <button onClick={() => handleDelete(file)} style={{
                    background: '#f44336',
                    color: 'white',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lamport Clock */}
      <section style={{
        marginBottom: '2rem',
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        background: '#fff'
      }}>
        <h2>🕒 Lamport Clock Simulation</h2>
        {clocks.map(c => (
          <p key={c.node}><strong>Node {c.node}</strong>: Clock = {c.clock}</p>
        ))}
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => sendMessage('A', 'B')} style={{ marginRight: '1rem' }}>
            Send A ➝ B
          </button>
          <button onClick={() => sendMessage('B', 'A')}>
            Send B ➝ A
          </button>
        </div>
      </section>
    </main>
  )
}
