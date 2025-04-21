'use client'

import React, { useEffect, useState } from 'react'

const API_BASE = 'http://localhost:8000'

export default function Home() {
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stats, setStats] = useState<{ totalFiles: number, totalBytes: number, quotaBytes: number } | null>(null)
  const [replicaStatus, setReplicaStatus] = useState<Record<string, boolean>>({})
  const [leader, setLeader] = useState<string>('Loading...')

  const [clocks, setClocks] = useState([
    { node: 'A', clock: 0 },
    { node: 'B', clock: 0 }
  ])

  useEffect(() => {
    fetchFiles()
    fetchStats()
    checkReplicas()
    fetchLeader()

    const interval = setInterval(() => {
      checkReplicas()
      fetchLeader()
    }, 5000)

    const tick = setInterval(() => {
      setClocks(prev => prev.map(c => ({ ...c, clock: c.clock + 1 })))
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(tick)
    }
  }, [])

  const fetchLeader = async () => {
    try {
      const res = await fetch(`${API_BASE}/leader`)
      const text = await res.text()
      setLeader(text)
    } catch {
      setLeader('Unknown')
    }
  }

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/files`)
      const data = await res.json()
      setFiles(data)
    } catch (err) {
      console.error('❌ Failed to fetch files', err)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('❌ Failed to fetch stats', err)
    }
  }

  const checkReplicas = async () => {
    const replicas = ["http://localhost:8001", "http://localhost:8002"]
    const status: Record<string, boolean> = {}

    for (const url of replicas) {
      try {
        const res = await fetch(`${url}/health`)
        status[url] = res.ok
      } catch {
        status[url] = false
      }
    }

    setReplicaStatus(status)
  }

  const handleUpload = async () => {
    if (!selectedFile) return alert('Please select a file')

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        alert('✅ File uploaded')
        fetchFiles()
        fetchStats()
      } else {
        alert('❌ Upload failed')
      }
    } catch (err) {
      alert('❌ Upload error')
      console.error(err)
    }
  }

  const handleDownload = (filename: string) => {
    window.open(`${API_BASE}/download?name=${filename}`, '_blank')
  }

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`${API_BASE}/delete?name=${filename}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchFiles()
        fetchStats()
      }
    } catch (err) {
      console.error('❌ Failed to delete file', err)
    }
  }

  const sendMessage = (from: string, to: string) => {
    setClocks(prev => {
      const fromClock = prev.find(c => c.node === from)?.clock ?? 0
      return prev.map(c => {
        if (c.node === to) {
          return { ...c, clock: Math.max(c.clock, fromClock) + 1 }
        }
        return c
      })
    })
  }

  return (
    <main style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: 1.6
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
        📁 Distributed File System UI
      </h1>

      {/* 🧠 Leader Info */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#e3f7d3',
        border: '1px solid #b5e07a',
        borderRadius: '5px'
      }}>
        <strong>👑 Current Leader:</strong> {leader}
      </div>

      {/* Upload */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>📤 Upload File</h2>
        <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
        <button
          onClick={handleUpload}
          style={{
            marginLeft: '1rem',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Upload
        </button>
      </section>

      {/* Storage Usage */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>📦 Storage Usage</h2>
        {stats ? (
          <>
            <p>Total Files: {stats.totalFiles}</p>
            <p>
              Used: {(stats.totalBytes / 1024 / 1024).toFixed(2)} MB /
              {(stats.quotaBytes / 1024 / 1024)} MB
            </p>
            <div style={{ height: '12px', background: '#ddd', borderRadius: '4px' }}>
              <div style={{
                width: `${(stats.totalBytes / stats.quotaBytes) * 100}%`,
                height: '100%',
                background: '#4caf50',
                borderRadius: '4px'
              }} />
            </div>
          </>
        ) : <p>Loading stats...</p>}
      </section>

      {/* Replica Status */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>🔁 Replica Status</h2>
        <ul>
          {Object.entries(replicaStatus).map(([url, alive]) => (
            <li key={url} style={{ color: alive ? 'green' : 'red' }}>
              {url}: {alive ? '✅ ALIVE' : '❌ OFFLINE'}
            </li>
          ))}
        </ul>
      </section>

      {/* File List */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>📄 Available Files</h2>
        {files.length === 0 ? <p>No files found.</p> : (
          <ul>
            {files.map((file) => (
              <li key={file} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
                padding: '0.5rem 0'
              }}>
                <span>{file}</span>
                <span>
                  <button onClick={() => handleDownload(file)} style={{ marginRight: '1rem' }}>
                    Download
                  </button>
                  <button onClick={() => handleDelete(file)} style={{ color: 'red' }}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lamport Clock UI */}
      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '6px' }}>
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
