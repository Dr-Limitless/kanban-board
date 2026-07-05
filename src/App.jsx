import { useEffect, useState, useRef } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { db, auth } from './firebase.js'

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

const TAGS = {
  client: { label: 'Client Search', cls: 'client' },
  core: { label: 'Core Dev', cls: 'core' },
  fleet: { label: 'Fleet Module', cls: 'fleet' },
  docs: { label: 'Documentation', cls: 'docs' },
  test: { label: 'Testing/Demo', cls: 'test' },
}

const TIMELINE = [
  { week: 3, date: 'Jun 29–Jul 4', label: 'Title Approval' },
  { week: 4, date: 'Jul 6–11', label: 'Ch.1 + Client Search', current: true },
  { week: 5, date: 'Jul 13–18', label: 'RRL Pt.2, Frameworks' },
  { week: 6, date: 'Jul 20–25', label: 'Ch.2-3 + Core Dev' },
  { week: 7, date: 'Jul 27–Aug 1', label: 'Final Edit + Clearance' },
  { week: 8, date: 'Aug 3–8', label: 'Submit Manuscript' },
  { week: 9, date: 'Aug 11–15', label: 'Final Defense Wk.1' },
]

const CARDS_COLLECTION = 'kanbanCards'

const STARTER_CARDS = [
  { title: 'Outreach sa cooperatives/microfinance (email/visit)', tag: 'client', col: 'inprogress' },
  { title: 'Sundan follow-up sa mga na-contact na', tag: 'client', col: 'backlog' },
  { title: 'Finalize client partnership / consent', tag: 'client', col: 'backlog' },
  { title: 'Database schema design (Supabase/PostgreSQL)', tag: 'core', col: 'inprogress' },
  { title: 'Supabase Auth setup (roles: admin/staff/member)', tag: 'core', col: 'backlog' },
  { title: 'UI/UX wireframes - core modules', tag: 'core', col: 'backlog' },
  { title: 'Loan & savings management module', tag: 'core', col: 'backlog' },
  { title: 'ESP32 + sensor prototype testing (test vehicle)', tag: 'fleet', col: 'backlog' },
  { title: 'Fleet module integration sa main system', tag: 'fleet', col: 'backlog' },
  { title: 'Chapter 1: Background of the Study', tag: 'docs', col: 'inprogress' },
  { title: 'RRL Part 1', tag: 'docs', col: 'review' },
  { title: 'Theoretical & Conceptual Framework', tag: 'docs', col: 'backlog' },
  { title: 'Groupings & orientation', tag: 'docs', col: 'done' },
  { title: 'Title approval sheet submission', tag: 'docs', col: 'done' },
  { title: 'Demo prep para sa defense', tag: 'test', col: 'backlog' },
]

export default function App() {
  const [cards, setCards] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [addFormOpenFor, setAddFormOpenFor] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('core')
  const draggedId = useRef(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, CARDS_COLLECTION), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setCards(list)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user)
    })
    return () => unsub()
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setShowLogin(false)
      setEmail('')
      setPassword('')
    } catch (err) {
      setLoginError('Mali ang email/password.')
    }
  }

  async function handleLogout() {
    await signOut(auth)
  }

  async function seedStarterCards() {
    for (const c of STARTER_CARDS) {
      await addDoc(collection(db, CARDS_COLLECTION), {
        ...c,
        createdAt: serverTimestamp(),
      })
    }
  }

  async function addCard(colId) {
    if (!newTitle.trim()) return
    await addDoc(collection(db, CARDS_COLLECTION), {
      title: newTitle.trim(),
      tag: newTag,
      col: colId,
      createdAt: serverTimestamp(),
    })
    setNewTitle('')
    setAddFormOpenFor(null)
  }

  async function deleteCard(id) {
    await deleteDoc(doc(db, CARDS_COLLECTION, id))
  }

  async function moveCard(id, newCol) {
    await updateDoc(doc(db, CARDS_COLLECTION, id), { col: newCol })
  }

  function handleDrop(colId) {
    setDragOverCol(null)
    if (isAdmin && draggedId.current) {
      moveCard(draggedId.current, colId)
      draggedId.current = null
    }
  }

  return (
    <div className="board">
      <div className="board-header">
        <div>
          <h1 className="board-title"> Section 41023 Capstone Sprint Board</h1>
          <p className="board-sub">
            Microfinancial Management System 
            {isAdmin ? ' — edit mode' : ' — view only'}
          </p>
          {isAdmin && cards.length === 0 && (
            <button className="ghost-btn" onClick={seedStarterCards} style={{ marginLeft: 4 }}>
              ＋ Load starter cards
            </button>
          )}
        </div>
        <div className="auth-corner">
          {isAdmin ? (
            <button className="ghost-btn" onClick={handleLogout}>
              Log out
            </button>
          ) : showLogin ? (
            <form className="login-form" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="add-btn">
                Login
              </button>
              {loginError && <span className="login-error">{loginError}</span>}
            </form>
          ) : (
            <button className="ghost-btn" onClick={() => setShowLogin(true)}>
              Edit mode
            </button>
          )}
        </div>
      </div>

      <div className="timeline-wrap">
        <div className="timeline">
          {TIMELINE.map((t, i) => (
            <div key={t.week} style={{ display: 'contents' }}>
              <div className={'tl-step' + (t.current ? ' current' : '')}>
                <div className="tl-week">Week {t.week}</div>
                <div className="tl-date">{t.date}</div>
                <div className="tl-label">{t.label}</div>
              </div>
              {i < TIMELINE.length - 1 && <div className="tl-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="columns">
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.col === col.id)
          return (
            <div
              key={col.id}
              className={'column' + (dragOverCol === col.id ? ' drag-over' : '')}
              onDragOver={(e) => {
                if (!isAdmin) return
                e.preventDefault()
                setDragOverCol(col.id)
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="col-header">
                {col.label}
                <span className="col-count">{colCards.length}</span>
              </div>
              <div className="cards">
                {colCards.map((card) => {
                  const tagInfo = TAGS[card.tag] || TAGS.core
                  return (
                    <div
                      key={card.id}
                      className="card"
                      draggable={isAdmin}
                      onDragStart={() => {
                        draggedId.current = card.id
                      }}
                    >
                      <div className="pin" />
                      {isAdmin && (
                        <button
                          className="card-del"
                          title="Delete"
                          onClick={() => deleteCard(card.id)}
                        >
                          ✕
                        </button>
                      )}
                      <span className={'tag ' + tagInfo.cls}>{tagInfo.label}</span>
                      <div className="card-title">{card.title}</div>
                    </div>
                  )
                })}
              </div>

              {isAdmin && (
                addFormOpenFor === col.id ? (
                  <div className="add-form">
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <select value={newTag} onChange={(e) => setNewTag(e.target.value)}>
                      {Object.keys(TAGS).map((k) => (
                        <option key={k} value={k}>
                          {TAGS[k].label}
                        </option>
                      ))}
                    </select>
                    <button className="add-btn" onClick={() => addCard(col.id)}>
                      Add card
                    </button>
                  </div>
                ) : (
                  <button
                    className="toggle-add"
                    onClick={() => setAddFormOpenFor(col.id)}
                  >
                    + Add task
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      <div className="save-note">
        {isAdmin
          ? 'Naka-log in ka bilang editor • real-time syncing sa lahat ng tumitingin'
          : 'View-only mode • real-time updates'}
      </div>
    </div>
  )
}