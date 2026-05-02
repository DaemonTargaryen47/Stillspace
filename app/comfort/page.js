'use client'
import { useState, useEffect, useRef } from 'react'
import Navigation from '../../components/Navigation'
import { getReflection } from '../../lib/constants'
import { storage, saveEchoEntry, hydrateUserFromSupabase } from '../../lib/store'

const REMINDERS = [
  "You don't have to have it all figured out.",
  "It's okay to take up space.",
  "Your feelings are not a burden.",
  "Rest is not the same as giving up.",
  "You are allowed to change your mind.",
  "Slow is not the same as stuck.",
  "You are enough, exactly as you are.",
]

const SOUND_GROUPS = [
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌿',
    sounds: [
      { id: 'rain_light', label: 'Light Rain', icon: '🌧', freq: 'rain', variant: 'light' },
      { id: 'rain_heavy', label: 'Heavy Rain', icon: '⛈', freq: 'rain', variant: 'heavy' },
      { id: 'ocean', label: 'Ocean Waves', icon: '🌊', freq: 'ocean', variant: null },
      { id: 'forest', label: 'Forest', icon: '🌲', freq: 'forest', variant: null },
    ]
  },
  {
    id: 'noise',
    label: 'Focus Noise',
    icon: '🌫',
    sounds: [
      { id: 'white', label: 'White Noise', icon: '◻', freq: 'white', variant: null },
      { id: 'brown', label: 'Brown Noise', icon: '🟫', freq: 'brown', variant: null },
      { id: 'pink', label: 'Pink Noise', icon: '🩷', freq: 'pink', variant: null },
    ]
  },
  {
    id: 'cozy',
    label: 'Safe Space',
    icon: '🕯',
    sounds: [
      { id: 'fireplace', label: 'Hearth Glow', icon: '🔥', freq: 'fireplace', variant: null },
      { id: 'warm_room', label: 'Warm Distant Room', icon: '🫂', freq: 'warm_room', variant: null },
      { id: 'fabric', label: 'Soft Fabric', icon: '🧸', freq: 'fabric', variant: null },
      { id: 'protected', label: 'Protected Silence', icon: '🌑', freq: 'protected', variant: null },
    ]
  }
]

const PRESETS = [
  { id: 'calm_night', label: 'Calm Night', icon: '🌙', desc: 'light rain + ocean', sounds: ['rain_light', 'ocean'], volumes: { rain_light: 0.6, ocean: 0.4 } },
  { id: 'deep_focus', label: 'Deep Focus', icon: '🧘', desc: 'brown noise', sounds: ['brown'], volumes: { brown: 0.8 } },
  { id: 'safe_space', label: 'Safe Space', icon: '🕯', desc: 'hearth glow + protected silence', sounds: ['fireplace', 'protected'], volumes: { fireplace: 0.6, protected: 0.5 } },
  { id: 'held', label: 'Being Held', icon: '🫂', desc: 'warm distant room + soft fabric', sounds: ['warm_room', 'fabric'], volumes: { warm_room: 0.5, fabric: 0.5 } },
]

const TIMERS = [
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: 'Sleep', ms: null },
]

class SoundEngine {
  constructor() {
    this.ctx = null
    this.nodes = {}
    this.gainNodes = {}
    this.masterGain = null
  }

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.connect(this.ctx.destination)
    this.masterGain.gain.value = 0.7
  }

  setMasterVolume(vol) {
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1)
  }

  setSoundVolume(id, vol) {
    if (this.gainNodes[id]) this.gainNodes[id].gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1)
  }

  createNoise(type) {
    const bufferSize = this.ctx.sampleRate * 4
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    } else if (type === 'brown') {
      let last = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (last + 0.02 * white) / 1.02
        last = data[i]
        data[i] *= 3.5
      }
    } else if (type === 'pink') {
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0=0.99886*b0+white*0.0555179; b1=0.99332*b1+white*0.0750759
        b2=0.96900*b2+white*0.1538520; b3=0.86650*b3+white*0.3104856
        b4=0.55000*b4+white*0.5329522; b5=-0.7616*b5-white*0.0168980
        data[i]=(b0+b1+b2+b3+b4+b5+b6+white*0.5362)/5.5; b6=white*0.115926
      }
    }
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    return source
  }

  buildSound(id, freq, variant) {
    const gainNode = this.ctx.createGain()
    gainNode.gain.value = 0
    gainNode.connect(this.masterGain)
    this.gainNodes[id] = gainNode
    let sources = []

    if (freq === 'white' || freq === 'brown' || freq === 'pink') {
      const noise = this.createNoise(freq)
      noise.connect(gainNode)
      noise.start()
      sources = [noise]

    } else if (freq === 'rain') {
      const noise = this.createNoise('white')
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = variant === 'heavy' ? 800 : 400
      filter.Q.value = variant === 'heavy' ? 0.5 : 1
      noise.connect(filter)
      filter.connect(gainNode)
      noise.start()
      sources = [noise]

    } else if (freq === 'ocean') {
      const noise = this.createNoise('pink')
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 600
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 0.1
      lfoGain.gain.value = 200
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      noise.connect(filter)
      filter.connect(gainNode)
      noise.start()
      lfo.start()
      sources = [noise, lfo]

    } else if (freq === 'forest') {
      const noise = this.createNoise('pink')
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1200
      filter.Q.value = 0.8
      noise.connect(filter)
      filter.connect(gainNode)
      noise.start()
      sources = [noise]

    } else if (freq === 'fireplace') {
      // Hearth Glow — slow warm pulse, almost no crackle, continuous warmth
      const noise = this.createNoise('brown')
      const lowFilter = this.ctx.createBiquadFilter()
      lowFilter.type = 'lowpass'
      lowFilter.frequency.value = 180
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 0.08
      lfoGain.gain.value = 40
      lfo.connect(lfoGain)
      lfoGain.connect(lowFilter.frequency)
      noise.connect(lowFilter)
      lowFilter.connect(gainNode)
      noise.start()
      lfo.start()
      sources = [noise, lfo]

    } else if (freq === 'warm_room') {
      // Warm Distant Room — muffled, low presence, no distinct voices
      const noise = this.createNoise('pink')
      const lowFilter = this.ctx.createBiquadFilter()
      lowFilter.type = 'lowpass'
      lowFilter.frequency.value = 250
      const midFilter = this.ctx.createBiquadFilter()
      midFilter.type = 'peaking'
      midFilter.frequency.value = 120
      midFilter.gain.value = 6
      midFilter.Q.value = 0.5
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 0.05
      lfoGain.gain.value = 20
      lfo.connect(lfoGain)
      lfoGain.connect(lowFilter.frequency)
      noise.connect(lowFilter)
      lowFilter.connect(midFilter)
      midFilter.connect(gainNode)
      noise.start()
      lfo.start()
      sources = [noise, lfo]

    } else if (freq === 'fabric') {
      // Soft Fabric Movement — very soft low-frequency cloth texture
      const noise = this.createNoise('brown')
      const filter1 = this.ctx.createBiquadFilter()
      filter1.type = 'bandpass'
      filter1.frequency.value = 300
      filter1.Q.value = 2
      const filter2 = this.ctx.createBiquadFilter()
      filter2.type = 'lowpass'
      filter2.frequency.value = 400
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 0.15
      lfoGain.gain.value = 60
      lfo.connect(lfoGain)
      lfoGain.connect(filter1.frequency)
      noise.connect(filter1)
      filter1.connect(filter2)
      filter2.connect(gainNode)
      noise.start()
      lfo.start()
      sources = [noise, lfo]

    } else if (freq === 'protected') {
      // Protected Silence — near silence, soft air hum, distant resonance
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 55
      const oscGain = this.ctx.createGain()
      oscGain.gain.value = 0.04
      osc.connect(oscGain)
      oscGain.connect(gainNode)
      const noise = this.createNoise('brown')
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 80
      const noiseGain = this.ctx.createGain()
      noiseGain.gain.value = 0.08
      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(gainNode)
      osc.start()
      noise.start()
      sources = [osc, noise]
    }

    this.nodes[id] = sources
  }

  play(id, freq, variant, volume = 0.5) {
    this.init()
    if (this.ctx.state === 'suspended') this.ctx.resume()
    if (!this.gainNodes[id]) this.buildSound(id, freq, variant)
    this.gainNodes[id].gain.setTargetAtTime(volume, this.ctx.currentTime, 0.5)
  }

  stop(id) {
    if (this.gainNodes[id]) this.gainNodes[id].gain.setTargetAtTime(0, this.ctx.currentTime, 0.5)
  }

  stopAll() {
    Object.keys(this.gainNodes).forEach(id => this.stop(id))
  }

  destroy() {
    if (this.ctx) { this.ctx.close(); this.ctx = null; this.nodes = {}; this.gainNodes = {}; this.masterGain = null }
  }
}

const engine = typeof window !== 'undefined' ? new SoundEngine() : null

function ComfortSounds() {
  const [activeSounds, setActiveSounds] = useState({})
  const [masterVol, setMasterVol] = useState(0.7)
  const [timerIdx, setTimerIdx] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [activePreset, setActivePreset] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showSounds, setShowSounds] = useState(false)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)

  useEffect(() => {
    return () => {
      if (engine) engine.stopAll()
      clearTimeout(timerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  const toggleSound = (sound, volume) => {
    const vol = volume !== undefined ? volume : 0.5
    setActiveSounds(prev => {
      const next = { ...prev }
      if (next[sound.id] !== undefined) {
        engine?.stop(sound.id)
        delete next[sound.id]
      } else {
        if (Object.keys(next).length >= 3) return prev
        engine?.play(sound.id, sound.freq, sound.variant, vol)
        next[sound.id] = vol
      }
      setIsPlaying(Object.keys(next).length > 0)
      return next
    })
  }

  const updateSoundVolume = (soundId, vol) => {
    engine?.setSoundVolume(soundId, vol)
    setActiveSounds(prev => ({ ...prev, [soundId]: vol }))
  }

  const applyPreset = (preset) => {
    if (engine) engine.stopAll()
    setActiveSounds({})
    setActivePreset(preset.id)
    setTimeout(() => {
      const newActive = {}
      preset.sounds.forEach(sid => {
        const sound = SOUND_GROUPS.flatMap(g => g.sounds).find(s => s.id === sid)
        if (sound) {
          const vol = preset.volumes[sid] || 0.5
          engine?.play(sound.id, sound.freq, sound.variant, vol)
          newActive[sid] = vol
        }
      })
      setActiveSounds(newActive)
      setIsPlaying(Object.keys(newActive).length > 0)
    }, 100)
  }

  const stopAll = () => {
    engine?.stopAll()
    setActiveSounds({})
    setIsPlaying(false)
    setActivePreset(null)
    clearTimeout(timerRef.current)
    clearInterval(countdownRef.current)
    setTimeLeft(null)
    setTimerIdx(null)
  }

  const setTimer = (idx) => {
    clearTimeout(timerRef.current)
    clearInterval(countdownRef.current)
    setTimerIdx(idx)
    const timer = TIMERS[idx]
    if (!timer.ms) { setTimeLeft('sleep'); return }
    setTimeLeft(timer.ms / 1000)
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); stopAll(); return null }
        return prev - 1
      })
    }, 1000)
    timerRef.current = setTimeout(stopAll, timer.ms)
  }

  const formatTimeLeft = (secs) => {
    if (!secs || secs === 'sleep') return ''
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m + ':' + String(s).padStart(2, '0')
  }

  const handleMasterVol = (val) => {
    setMasterVol(val)
    engine?.setMasterVolume(val)
  }

  const activeCount = Object.keys(activeSounds).length
  const allSoundsFlat = SOUND_GROUPS.flatMap(g => g.sounds)

  return (
    <section style={{ marginBottom: 20 }}>
      <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🎧</span>
              <div>
                <p className="text-p" style={{ fontSize: 15, fontWeight: 500 }}>Comfort Sounds</p>
                <p className="text-m" style={{ fontSize: 11 }}>
                  {isPlaying
                    ? activeCount + ' sound' + (activeCount > 1 ? 's' : '') + ' playing' + (timeLeft && timeLeft !== 'sleep' ? ' · ' + formatTimeLeft(timeLeft) : timeLeft === 'sleep' ? ' · sleep mode' : '')
                    : 'tap a preset to begin'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isPlaying && (
                <button onClick={stopAll} style={{ padding: '6px 12px', background: 'rgba(192,57,43,0.08)', border: 'none', borderRadius: 999, fontSize: 12, color: '#c0392b', cursor: 'pointer' }}>stop</button>
              )}
              <button onClick={() => setShowSounds(p => !p)} style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 999, fontSize: 12, cursor: 'pointer' }} className="text-s">
                {showSounds ? 'less' : 'browse'}
              </button>
            </div>
          </div>

          {/* Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            {PRESETS.map(preset => (
              <button key={preset.id} onClick={() => applyPreset(preset)} style={{
                padding: '12px 14px', textAlign: 'left',
                background: activePreset === preset.id ? 'rgba(138,158,140,0.15)' : 'rgba(0,0,0,0.03)',
                border: activePreset === preset.id ? '1.5px solid rgba(138,158,140,0.4)' : '1.5px solid transparent',
                borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 16 }}>{preset.icon}</span>
                  <p className="text-p" style={{ fontSize: 13, fontWeight: 500 }}>{preset.label}</p>
                </div>
                <p className="text-m" style={{ fontSize: 11 }}>{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Volume controls */}
        {isPlaying && activeCount > 0 && (
          <div style={{ padding: '0 24px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="section-label" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: 14 }}>volumes</p>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <p className="text-s" style={{ fontSize: 12 }}>Master</p>
                <p className="text-m" style={{ fontSize: 11 }}>{Math.round(masterVol * 100)}%</p>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={masterVol}
                onChange={e => handleMasterVol(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#8a9e8c', height: 4, cursor: 'pointer' }}
              />
            </div>
            {Object.entries(activeSounds).map(([sid, vol]) => {
              const sound = allSoundsFlat.find(s => s.id === sid)
              if (!sound) return null
              return (
                <div key={sid} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p className="text-s" style={{ fontSize: 12 }}>{sound.icon} {sound.label}</p>
                    <p className="text-m" style={{ fontSize: 11 }}>{Math.round(vol * 100)}%</p>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={vol}
                    onChange={e => updateSoundVolume(sid, parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#8a9e8c', height: 4, cursor: 'pointer' }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Timer */}
        {isPlaying && (
          <div style={{ padding: '0 24px 16px' }}>
            <p className="section-label" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>auto-stop</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIMERS.map((t, i) => (
                <button key={i}
                  onClick={() => timerIdx === i ? (clearTimeout(timerRef.current), clearInterval(countdownRef.current), setTimerIdx(null), setTimeLeft(null)) : setTimer(i)}
                  style={{ flex: 1, padding: '7px 4px', background: timerIdx === i ? '#2c2c2e' : 'rgba(0,0,0,0.04)', color: timerIdx === i ? '#faf9f7' : undefined, border: 'none', borderRadius: 10, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  className={timerIdx === i ? '' : 'text-s'}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Browse sounds */}
        {showSounds && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '16px 24px 20px' }}>
            <p className="text-m" style={{ fontSize: 11, marginBottom: 14 }}>Mix up to 3 sounds together</p>
            {SOUND_GROUPS.map(group => (
              <div key={group.id} style={{ marginBottom: 16 }}>
                <p className="section-label" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {group.icon} {group.label}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.sounds.map(sound => {
                    const isActive = activeSounds[sound.id] !== undefined
                    const isDisabled = !isActive && activeCount >= 3
                    return (
                      <button key={sound.id} onClick={() => !isDisabled && toggleSound(sound)}
                        style={{
                          padding: '8px 14px', borderRadius: 999, border: 'none',
                          cursor: isDisabled ? 'default' : 'pointer',
                          background: isActive ? '#8a9e8c' : 'rgba(0,0,0,0.05)',
                          color: isActive ? '#ffffff' : undefined,
                          opacity: isDisabled ? 0.4 : 1,
                          fontSize: 13, transition: 'all 0.2s ease',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }} className={isActive ? '' : 'text-s'}>
                        <span>{sound.icon}</span>
                        <span>{sound.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {activeCount >= 3 && (
              <p className="text-m" style={{ fontSize: 11, textAlign: 'center', marginTop: 4 }}>Maximum 3 sounds. Turn one off to add another.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default function ComfortPage() {
  const [text, setText] = useState('')
  const [reflection, setReflection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [breatheActive, setBreatheActive] = useState(false)
  const [phase, setPhase] = useState('tap to begin')
  const [timerRef, setTimerRef] = useState(null)
  const [echoHistory, setEchoHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const loadHistory = async () => {
      const user = storage.get('user')
      if (user && !user.isGuest) {
        const hydrated = await hydrateUserFromSupabase()
        setEchoHistory(hydrated?.echoHistory || [])
      } else {
        setEchoHistory(storage.get('echo_history') || [])
      }
    }
    loadHistory()
  }, [])

  const reflect = async () => {
    if (!text.trim()) return
    setLoading(true)
    setReflection(null)
    setTimeout(async () => {
      const result = getReflection(text)
      setReflection(result)
      setLoading(false)
      const entry = { text: text.trim(), reflection: result, timestamp: Date.now() }
      await saveEchoEntry(text.trim(), result)
      setEchoHistory(prev => [entry, ...prev].slice(0, 50))
    }, 900)
  }

  const startBreathe = () => {
    if (breatheActive) { clearTimeout(timerRef); setBreatheActive(false); setPhase('tap to begin'); return }
    setBreatheActive(true)
    const cycle = () => {
      setPhase('breathe in...')
      const t1 = setTimeout(() => {
        setPhase('hold...')
        const t2 = setTimeout(() => {
          setPhase('breathe out...')
          const t3 = setTimeout(cycle, 6000)
          setTimerRef(t3)
        }, 4000)
        setTimerRef(t2)
      }, 4000)
      setTimerRef(t1)
    }
    cycle()
  }

  const clearHistory = async () => {
    storage.remove('echo_history')
    const user = storage.get('user')
    if (user && !user.isGuest) {
      const { updateUser, pushToSupabase } = await import('../../lib/store')
      const updated = updateUser({ echoHistory: [] })
      await pushToSupabase(updated)
    }
    setEchoHistory([])
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 520, margin: '0 auto', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />
      <div style={{ padding: '108px 28px 0' }}>
        <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>a quiet space</p>
        <h1 className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>Comfort</h1>
        <p className="text-s" style={{ fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>No need to respond. This space is just for you.</p>

        <section style={{ marginBottom: 20 }}>
          <div className="card" style={{ borderRadius: 20, padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>emotional echo</p>
              {echoHistory.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 12, color: '#8a9e8c', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showHistory ? 'hide history' : 'view history (' + echoHistory.length + ')'}
                </button>
              )}
            </div>
            <p className="text-s" style={{ fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>Write a sentence about how you feel.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="I feel..." rows={3}
              className="input-field"
              style={{ width: '100%', border: '1.5px solid transparent', borderRadius: 14, padding: '14px 18px', fontSize: 16, resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, transition: 'border-color 0.2s ease' }}
              onFocus={e => e.target.style.borderColor = '#8a9e8c'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
            <button onClick={reflect} disabled={!text.trim() || loading} style={{ marginTop: 14, padding: '11px 28px', background: text.trim() && !loading ? '#2c2c2e' : '#f0ede8', color: text.trim() && !loading ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: 999, fontSize: 14, cursor: text.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.2s ease' }}>
              {loading ? 'listening...' : 'reflect'}
            </button>
            {reflection && (
              <div className="green-card" style={{ marginTop: 22, padding: '20px 22px', borderRadius: 16, borderLeft: '3px solid #8a9e8c' }}>
                <p style={{ fontSize: 18, color: '#4a5a4c', lineHeight: 1.75, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{reflection}</p>
              </div>
            )}
          </div>
        </section>

        {showHistory && echoHistory.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div className="card" style={{ borderRadius: 20, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>your echo history · private</p>
                <button onClick={clearHistory} style={{ fontSize: 11, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}>clear all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {echoHistory.map((entry, i) => (
                  <div key={i} style={{ paddingBottom: 14, borderBottom: i < echoHistory.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p className="text-p" style={{ fontSize: 14, lineHeight: 1.5, flex: 1, paddingRight: 12 }}>"{entry.text}"</p>
                      <p className="text-f" style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(entry.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · {new Date(entry.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: '#8a9e8c', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{entry.reflection}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 20 }}>
          <div className="card" style={{ padding: '32px 24px', borderRadius: 20, textAlign: 'center' }}>
            <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>breathing space</p>
            <div onClick={startBreathe} style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ position: 'absolute', width: 120 - i * 20, height: 120 - i * 20, borderRadius: '50%', border: '1.5px solid #8a9e8c', opacity: breatheActive ? 0.6 - i * 0.15 : 0.2, animation: breatheActive ? 'breathe ' + (4 + i) + 's ease-in-out infinite' : 'none', animationDelay: i * 0.3 + 's', transition: 'opacity 0.5s ease' }} />
              ))}
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: breatheActive ? '#8a9e8c' : '#f0ede8', transition: 'all 0.5s ease', animation: breatheActive ? 'breathe 4s ease-in-out infinite' : 'none' }} />
            </div>
            <p className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6 }}>{phase}</p>
            {breatheActive && <p className="text-m" style={{ fontSize: 12 }}>tap to stop</p>}
          </div>
        </section>

        <ComfortSounds />

        <section style={{ marginBottom: 20 }}>
          <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>gentle reminders</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REMINDERS.map((reminder, i) => (
              <div key={i} className="card" style={{ padding: '18px 22px', borderRadius: 16, borderLeft: '3px solid rgba(138,158,140,0.3)', fontSize: 15, lineHeight: 1.6, fontFamily: i % 2 === 0 ? 'var(--font-serif)' : 'var(--font-sans)' }}>
                <span className="text-s">{reminder}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="green-card" style={{ padding: '28px 24px', borderRadius: 18, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#4a5a4c', lineHeight: 1.7, fontStyle: 'italic' }}>
            "The quieter you become,<br />the more you can hear."
          </p>
        </div>
      </div>
    </div>
  )
}
