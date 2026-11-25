import React, { useEffect, useMemo, useRef } from 'react'
import homeSource from './designs/home.html?raw'
import caseStudySource from './designs/case-study.html?raw'
import notFoundSource from './designs/not-found.html?raw'

const sections = {
  work: 'featured-projects',
  about: 'about',
  journey: 'journey-timeline',
  skills: 'skills-experience',
  resume: 'resume',
  'live-demo': 'live-demo',
  contact: 'contact',
}

const resumeCopy = {
  Frontend: {
    title: 'Frontend Architecture & UI Engineering Track',
    description: 'Focused on accessible interfaces, component systems, and responsive web applications.',
    projects: ['[Project Placeholder: Accessible Client UI]', '[Project Placeholder: Design System & Tokens]'],
    skills: ['React', 'Tailwind CSS', 'Shadcn UI', 'Framer Motion', 'Firebase'],
  },
  Automation: {
    title: 'AI & Workflow Automation Track',
    description: 'Focused on workflow design, event triggers, and reducing repetitive work.',
    projects: ['[Project Placeholder: Workflow Automation]', '[Project Placeholder: Intake Pipeline]'],
    skills: ['Make', 'n8n', 'Webhooks', 'API Integrations'],
  },
  Fullstack: {
    title: 'Fullstack Engineering Track',
    description: 'Focused on complete user flows, from the interface to connected services.',
    projects: ['[Project Placeholder: Fullstack Application]', '[Project Placeholder: Connected Workflow]'],
    skills: ['React', 'Firebase', 'Tailwind CSS', 'Make', 'n8n'],
  },
}

function pageForPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'home'
  if (path.startsWith('/projects/') && path.length > '/projects/'.length) return 'case-study'
  return 'not-found'
}

function stitchBody(source) {
  const document = new DOMParser().parseFromString(source, 'text/html')
  document.querySelectorAll('script').forEach((element) => element.remove())
  document.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith('on')) element.removeAttribute(attribute.name)
    }
  })
  return { html: document.body.innerHTML, className: document.body.className, title: document.title }
}

function setText(element, value) {
  if (element) element.textContent = value
}

function wireLinks(root, page) {
  for (const anchor of root.querySelectorAll('a')) {
    const href = anchor.getAttribute('href') || ''
    const label = anchor.textContent.trim().toLowerCase()
    if (page === 'home' && href === '#' && label.includes('case study')) {
      anchor.href = '/projects/case-study'
    } else if (page === 'not-found' && href.startsWith('#')) {
      const target = href === '#home' ? '' : href === '#work' ? 'featured-projects' : href === '#journey' ? 'journey-timeline' : href === '#skills' ? 'skills-experience' : href.slice(1)
      anchor.href = target ? `/#${target}` : '/'
    } else if (page === 'case-study' && anchor.dataset.path) {
      anchor.href = `/#${sections[anchor.dataset.path] || 'featured-projects'}`
    } else if (page === 'case-study' && href === '#' && label === 'home') {
      anchor.href = '/'
    } else if (page === 'case-study' && href === '#' && label.includes('projects')) {
      anchor.href = '/#featured-projects'
    }
    if (
      (anchor.getAttribute('href') === '#' && !anchor.dataset.path) ||
      href === 'https://github.com' ||
      href === 'https://linkedin.com' ||
      href === 'mailto:hello@domain.com' ||
      href === 'mailto:contact@example.com'
    ) {
      anchor.addEventListener('click', (event) => event.preventDefault())
      anchor.setAttribute('title', 'Link to be added')
      anchor.setAttribute('aria-disabled', 'true')
    }
  }
}

function wireHome(root) {
  const cleanups = []
  const filters = [...root.querySelectorAll('#project-filters .filter-btn')]
  const cards = [...root.querySelectorAll('#projects-grid .project-card')]
  for (const button of filters) {
    const onClick = () => {
      for (const item of filters) {
        const active = item === button
        item.classList.toggle('bg-surface-container-lowest', active)
        item.classList.toggle('text-primary', active)
        item.classList.toggle('shadow-sm', active)
        item.classList.toggle('font-semibold', active)
        item.classList.toggle('text-secondary', !active)
      }
      for (const card of cards) {
        card.style.display = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter ? 'flex' : 'none'
      }
    }
    button.addEventListener('click', onClick)
    cleanups.push(() => button.removeEventListener('click', onClick))
  }

  const resume = root.querySelector('#resume')
  const tabs = [...root.querySelectorAll('#resume-lens-selector button')]
  const panel = resume?.querySelector('.bg-surface-container-lowest.rounded-xl')
  const previewCards = [...(panel?.querySelectorAll(':scope > .grid > div') || [])]
  for (const tab of tabs) {
    const onClick = () => {
      const copy = resumeCopy[tab.textContent.trim()]
      if (!copy) return
      for (const item of tabs) {
        const active = item === tab
        item.classList.toggle('bg-surface-container-lowest', active)
        item.classList.toggle('text-primary', active)
        item.classList.toggle('shadow-sm', active)
        item.classList.toggle('font-semibold', active)
        item.classList.toggle('text-secondary', !active)
        item.setAttribute('aria-selected', String(active))
      }
      const heading = panel?.querySelector('h3')
      setText(heading, copy.title)
      setText(heading?.nextElementSibling, copy.description)
      const projects = previewCards[1]?.querySelector('.mt-3')
      if (projects) projects.replaceChildren(...copy.projects.map((name) => {
        const item = document.createElement('div')
        item.className = 'font-body-sm text-on-surface font-medium'
        item.textContent = name
        return item
      }))
      const skills = previewCards[2]?.querySelector('.mt-3')
      if (skills) skills.replaceChildren(...copy.skills.map((name) => {
        const item = document.createElement('span')
        item.className = 'px-2 py-0.5 rounded bg-surface-container'
        item.textContent = name
        return item
      }))
    }
    tab.addEventListener('click', onClick)
    cleanups.push(() => tab.removeEventListener('click', onClick))
  }

  const runButton = root.querySelector('#run-simulation-btn')
  const timers = []
  let running = false
  const onRun = () => {
    if (running) return
    running = true
    const name = root.querySelector('#demo-name')?.value.trim() || 'Sample User'
    const email = root.querySelector('#demo-email')?.value.trim() || 'user@example.com'
    const workflow = root.querySelector('#demo-workflow')?.value || 'Sample workflow'
    const show = (stage, event, extra) => {
      setText(root.querySelector('#console-status'), `// STEP ${stage}/3: ${event}`)
      setText(root.querySelector('#console-latency'), `LATENCY: ${stage === 1 ? 40 : stage === 2 ? 120 : 220}ms`)
      setText(root.querySelector('#btn-text'), stage === 3 ? 'Rerun Simulation' : stage === 2 ? 'Processing Logic...' : 'Simulating Ingestion...')
      const payload = { notice: 'Preview only — no email is sent yet.', event, name, email, workflow, ...extra }
      setText(root.querySelector('#json-output'), JSON.stringify(payload, null, 2))
      for (let i = 1; i <= 3; i += 1) {
        const badge = root.querySelector(`#step-${i}`)
        badge?.classList.toggle('border', i <= stage)
        badge?.classList.toggle('border-primary-container/40', i <= stage)
      }
    }
    show(1, 'INGESTING SAMPLE PAYLOAD', { status: 'PROCESSING' })
    timers.push(window.setTimeout(() => show(2, 'SIMULATING WORKFLOW LOGIC', { status: 'PROCESSING' }), 1000))
    timers.push(window.setTimeout(() => {
      show(3, 'SIMULATION COMPLETE', { status: 'SIMULATION_SUCCESS', dispatched: false })
      running = false
    }, 2000))
  }
  runButton?.addEventListener('click', onRun)
  cleanups.push(() => {
    runButton?.removeEventListener('click', onRun)
    timers.forEach(window.clearTimeout)
  })

  const form = root.querySelector('#contact-form')
  const onSubmit = (event) => {
    event.preventDefault()
    const feedback = root.querySelector('#form-feedback')
    if (feedback) {
      feedback.classList.remove('hidden')
      setText(feedback.querySelector('span:last-child'), 'Contact form setup is pending. Please use a direct contact link once added.')
    }
  }
  form?.addEventListener('submit', onSubmit)
  cleanups.push(() => form?.removeEventListener('submit', onSubmit))
  return () => cleanups.forEach((cleanup) => cleanup())
}

function wireCaseStudy(root) {
  const links = [...root.querySelectorAll('aside nav a[href^="#section-"]')]
  const onScroll = () => {
    const current = [...links].reverse().find((link) => root.querySelector(link.getAttribute('href'))?.getBoundingClientRect().top <= 150)
    for (const link of links) {
      const active = link === current
      link.classList.toggle('bg-surface-container-low', active)
      link.classList.toggle('text-on-surface', active)
      link.classList.toggle('font-semibold', active)
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  return () => window.removeEventListener('scroll', onScroll)
}

function wireAppearance(root, page) {
  const cleanups = []
  const modeButtons = [...root.querySelectorAll('header button')].filter((button) =>
    ['Frontend', 'Automation'].includes(button.textContent.trim()),
  )
  const hero = root.querySelector('#work-top h1')
  const heroDescription = hero?.nextElementSibling
  const aboutHeading = root.querySelector('#about h2')
  for (const element of [hero, heroDescription, aboutHeading]) {
    if (element && !element.dataset.originalText) element.dataset.originalText = element.textContent
  }
  const original = {
    hero: hero?.dataset.originalText,
    description: heroDescription?.dataset.originalText,
    about: aboutHeading?.dataset.originalText,
  }
  const projectGrid = root.querySelector('#projects-grid')
  for (const [index, card] of [...(projectGrid?.children || [])].entries()) {
    if (!card.dataset.originalIndex) card.dataset.originalIndex = String(index)
  }
  const projectOrder = [...(projectGrid?.children || [])].sort((a, b) => Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex))
  const setMode = (mode) => {
    localStorage.setItem('portfolio-mode', mode)
    for (const button of modeButtons) {
      const active = button.textContent.trim() === mode
      button.classList.toggle('bg-surface-container-lowest', active)
      button.classList.toggle('text-primary', active)
      button.classList.toggle('shadow-sm', active)
      button.classList.toggle('text-on-surface-variant', !active)
      button.setAttribute('aria-pressed', String(active))
    }
    if (page !== 'home') return
    const automation = mode === 'Automation'
    setText(hero, automation
      ? 'AI Automation Engineer building workflows that give teams time back.'
      : original.hero)
    setText(heroDescription, automation
      ? 'I design connected workflows with Make and n8n, turning repetitive steps into clear, dependable processes.'
      : original.description)
    setText(aboutHeading, automation
      ? 'I build automation systems that connect tools and simplify everyday work.'
      : original.about)
    if (projectGrid) {
      const ordered = automation
        ? [...projectOrder].sort((a, b) => Number(b.dataset.category === 'automation') - Number(a.dataset.category === 'automation'))
        : projectOrder
      projectGrid.replaceChildren(...ordered)
    }
  }
  for (const button of modeButtons) {
    const onClick = () => setMode(button.textContent.trim())
    button.addEventListener('click', onClick)
    cleanups.push(() => button.removeEventListener('click', onClick))
  }
  setMode(localStorage.getItem('portfolio-mode') === 'Automation' ? 'Automation' : 'Frontend')

  const themeButton = root.querySelector('button[aria-label="Toggle light/dark mode"]')
  if (!themeButton) return () => cleanups.forEach((cleanup) => cleanup())
  const setTheme = (dark) => {
    root.classList.toggle('theme-dark', dark)
    localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light')
    themeButton?.setAttribute('aria-pressed', String(dark))
    setText(themeButton?.querySelector('.material-symbols-outlined'), dark ? 'light_mode' : 'routine')
  }
  const onThemeClick = () => setTheme(!root.classList.contains('theme-dark'))
  themeButton?.addEventListener('click', onThemeClick)
  cleanups.push(() => themeButton?.removeEventListener('click', onThemeClick))
  setTheme(localStorage.getItem('portfolio-theme') === 'dark')

  return () => cleanups.forEach((cleanup) => cleanup())
}

export default function App() {
  const page = pageForPath(window.location.pathname)
  const source = page === 'home' ? homeSource : page === 'case-study' ? caseStudySource : notFoundSource
  const design = useMemo(() => stitchBody(source), [source])
  const root = useRef(null)

  useEffect(() => {
    document.title = design.title
    wireLinks(root.current, page)
    const appearanceCleanup = wireAppearance(root.current, page)
    const pageCleanup = page === 'home' ? wireHome(root.current) : page === 'case-study' ? wireCaseStudy(root.current) : undefined
    return () => {
      appearanceCleanup()
      pageCleanup?.()
    }
  }, [page, design.title])

  return (
    <>
      <div ref={root} className={design.className} dangerouslySetInnerHTML={{ __html: design.html }} />
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a href="/">Home</a>
        <a href="/#featured-projects">Work</a>
        <a href="/#resume">Resume</a>
        <a href="/#contact">Contact</a>
      </nav>
    </>
  )
}
