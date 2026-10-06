"""Generate GitHub Pages HTML from the original-theme templates and latest CV data."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content/resume.json').read_text(encoding='utf-8'))
esc = html.escape
NAV = [('index.html', 'Home'), ('About.html', 'About'), ('Resume.html', 'Resume'),
       ('Reports.html', 'Reports/Notes'), ('Publications.html', 'Publications'),
       ('Projects.html', 'Projects'), ('Talks.html', 'Talks & Presentations')]


def link(url, label, cls='compact-button', download=False):
    return f'<a class="{cls}" href="{esc(url)}"'+(' download' if download else '')+f'>{esc(label)}</a>'


def card(title, description, meta='', url='', label='Explore', category=''):
    return (f'<article class="packed-card" data-category="{esc(category)}">'
            f'<h3>{esc(title)}</h3><p class="card-meta">{esc(meta)}</p>'
            f'<p>{esc(description)}</p>'+ (link(url, label) if url else '') + '</article>')


def grid(items):
    return '<div class="packed-grid">' + ''.join(items) + '</div>'


def section(title, body, id=''):
    return f'<section class="packed-section" id="{id}"><h2 class="section-title">{title}</h2>{body}</section>'


def filterbar(label, categories):
    return ('<div class="library-controls" hidden data-filter-controls>'
            f'<label>{label}<input type="search" data-library-search placeholder="Search by title, topic, or technology…"></label>'
            '<div class="filter-buttons" role="group" aria-label="Filter results">'+
            ''.join(f'<button type="button" data-filter="{value}" aria-pressed="{str(value == "all").lower()}">{text}</button>' for value, text in categories)+
            '</div><p data-library-count role="status"></p></div>')


def template(name):
    return (ROOT / 'templates' / name).read_text(encoding='utf-8')


def replace_container(document, body):
    return re.sub(r'<div class="container">.*?(?=</body>)',
                  '<main class="container" id="main">\n'+body+'\n</main>\n', document, flags=re.S)


def finish(document, filename):
    nav = ''.join(f'<a href="{path}"'+(' aria-current="page"' if path == filename else '')+f'>{name}</a>' for path, name in NAV)
    document = re.sub(r'<div class="(social-links|nav-links)">.*?</div>',
                      '<button class="nav-toggle" type="button" aria-controls="site-navigation" aria-expanded="false">Menu ☰</button>'
                      '<nav class="'+('nav-links' if filename == 'About.html' else 'social-links')+'" id="site-navigation" aria-label="Main navigation">'+nav+'</nav>', document, flags=re.S)
    document = document.replace('</head>', '''    <link rel="stylesheet" href="assets/css/enhancements.css">
    <script src="assets/js/enhancements.js" defer></script>
    <meta name="description" content="Mahesh Rajarapu, Ph.D. researcher at IIT Tirupati. Computer vision, document intelligence, privacy-preserving systems, and research software.">
    <meta name="theme-color" content="#222222">
</head>''')
    url = 'https://rajarapumahesh.github.io/My-website/'+('' if filename == 'index.html' else filename)
    title = re.search(r'<title>(.*?)</title>', document).group(1)
    document = document.replace('</head>', f'<link rel="canonical" href="{url}">\n<meta property="og:title" content="{esc(title)}">\n<meta property="og:type" content="website">\n<meta property="og:url" content="{url}">\n<meta property="og:image" content="https://rajarapumahesh.github.io/My-website/assets/images/mahesh_profile.jpg">\n</head>')
    document = document.replace('<body>', '<body>\n<a class="skip-link" href="#main">Skip to content</a>')
    if filename == 'index.html':
        document = document.replace('<div class="main-content">', '<main class="main-content" id="main">', 1)
        document = re.sub(r'</div>\s*</body>', '</main>\n</body>', document)
    elif 'id="main"' not in document:
        document = document.replace('<div class="container">', '<div class="container" id="main" role="main">', 1)
    document = re.sub(r'<footer>.*?</footer>', '', document, flags=re.S)
    footer = '<footer class="site-footer">© <span data-year>2026</span> Mahesh Rajarapu · '+link('assets/documents/Mahesh_CV.pdf','Latest CV','footer-link')+' · '+link('mailto:'+DATA['email'],'Contact','footer-link')+' · <a class="footer-link" href="#main">Back to top ↑</a></footer>'
    document = document.replace('</body>', footer+'\n</body>')
    document = document.replace('alt="Presentation 1"', 'alt="Neural network dissertation presentation"').replace('alt="Presentation 2"', 'alt="Internship insights seminar at SVNIT"').replace('alt="Presentation 3"', 'alt="KAI-X internship at KAIST"').replace('alt="Presentation 4"', 'alt="Low-cost manufacturing project at UNNATI Mahotsav"')
    document = re.sub(r'<img(?![^>]*mahesh_profile)([^>]+)>', r'<img loading="lazy"\1>', document)
    document = re.sub(r'target="_blank"(?! rel=)', 'target="_blank" rel="noopener noreferrer"', document)
    document = document.replace('><', '>\n<')
    document = '\n'.join(line.rstrip() for line in document.splitlines())+'\n'
    (ROOT / filename).write_text(document, encoding='utf-8')


home = template('index.html').replace('Int. M.Sc. student at SVNIT, India', 'Ph.D. Researcher at IIT Tirupati, India')
accepted_count = sum(p['category'] == 'accepted' for p in DATA['publications'])
sidebar_snapshot = (
    '<section class="sidebar-snapshot" aria-labelledby="snapshot-title">'
    '<h3 id="snapshot-title">Research Snapshot</h3>'
    '<p class="snapshot-location">Tirupati, India · Ph.D. since 2025</p>'
    '<div class="snapshot-topics"><span>Document AI</span><span>Computer Vision</span><span>Privacy & Biometrics</span></div>'
    '<div class="snapshot-stats">'
    f'<a href="Publications.html"><strong>{accepted_count}</strong><span>Accepted works</span></a>'
    f'<a href="Projects.html"><strong>{len(DATA["tools"])}</strong><span>Research tools</span></a>'
    '</div><div class="snapshot-actions">'+link('assets/documents/Mahesh_CV.pdf', 'Download CV ↓', download=True)+
    link('About.html#experience', 'My experience')+'</div></section>'
)
home = home.replace('    </div>\n\n    <div class="main-content">',
                    sidebar_snapshot+'\n    </div>\n\n    <div class="main-content">', 1)
intro = [
    'Hii, I am <strong style="color: #16A085;">Mahesh Rajarapu</strong>, a Ph.D. researcher and Junior Research Fellow in the Department of Computer Science and Engineering at <strong style="color: #8e44ad;">Indian Institute of Technology Tirupati</strong>, supervised by Dr. Kalidas Yeturu. I completed my Integrated M.Sc. in Mathematics at SVNIT Surat in June 2025. Mathematics continues to shape how I understand and solve problems in deep learning, image processing, and AI.',
    'My research focuses on <strong style="color: #8e44ad;">heritage-document analysis, structure-aware image segmentation, privacy-preserving document management, and face image quality assessment</strong>. I work on preserving knowledge in degraded palm-leaf manuscripts, understanding visual structure, and building reliable systems that protect sensitive information.',
    'I enjoy taking ideas from mathematical foundations to practical software. Alongside research, I have developed <strong style="color: #8e44ad;">ShreeAkshara, ANVESHANA, Palm Leaf Denoiser, and Kali-OMR</strong>: platforms for annotation, archival retrieval, image restoration, and automated evaluation. My work combines computer vision with full-stack development, Docker deployment, and human-in-the-loop workflows.',
    'My journey includes research experiences at <strong style="color: #8e44ad;">KAIST, IIM Mumbai, NIT Calicut, SVNIT, TU Munich, IIT Ropar, and TIFR-CAM</strong>. Curiosity and the pursuit of new experiences continue to drive my work. I welcome conversations about research, collaborations, and building useful AI systems.'
]
intro_html = ''.join('<p style="font-family: \'Courier New\', Courier, monospace; font-size: 18px; line-height: 1.75; color: #d1d8e6;">'+p+'</p>' for p in intro)
home = re.sub(r'(<div class="info">).*?(?=<!-- Reach out section -->)', r'\1\n'+intro_html+'\n', home, count=1, flags=re.S)
highlights = section('Research Highlights', grid([
    card('MU-FIQA · BIOSIG 2026', 'Verification-margin supervision and dual-stream fusion for face image quality assessment.', 'Accepted conference paper', 'Publications.html#mu-fiqa', 'Research details'),
    card('Neural Network Operators', 'Applications and performance analysis of neural-network operators in image processing.', 'Accepted Springer book chapter', 'Publications.html#neural-operators', 'Chapter details'),
    card('Digital Annotation Patent', 'Multi-mode digital annotation of image-based textual records.', 'Published patent application · 202641075717', 'Publications.html#annotation-patent', 'Application details')
]))
highlights += section('Research Software', grid(card(x[0], x[1], x[2], x[3], 'Open platform', x[4]) for x in DATA['tools']), 'research-software')
home = home.replace('<div class="updates-section">', highlights+'\n<div class="updates-section">', 1)
updates = '<tr><th scope="col">Date</th><th scope="col">Description</th></tr>'
updates += '<tr><td>2026</td><td>MU-FIQA accepted at BIOSIG 2026; Springer book chapter accepted. Research submissions: AKSHARA, PrivView, and SegVFNet.</td></tr>'
updates += '<tr><td>June 2026</td><td>Indian patent application 202641075717 filed June 18 and published June 26.</td></tr>'
updates += ''.join(f'<tr><td>{esc(x[2])}</td><td><strong>{esc(x[0])}</strong> · {esc(x[1])}. {esc(x[4])}</td></tr>' for x in DATA['experience'])
updates += '<tr><td>June 2025</td><td>Completed Integrated M.Sc. Mathematics at SVNIT (CGPA 7.68/10); dissertation grade 10/10 under Dr. Shivam Bajpeyi.</td></tr>'
home = re.sub(r'(<table class="updates-table">).*?</table>', r'\1'+updates+'</table>', home, count=1, flags=re.S)
home = home.replace('Computational Mathematics with SageMath (Ongoing)', 'Computational Mathematics with SageMath')
finish(home, 'index.html')

about = '<h1 class="page-title">About Mahesh</h1><p class="section-intro">Ph.D. researcher and Junior Research Fellow at IIT Tirupati, working with Dr. Kalidas Yeturu. My work connects mathematics, computer vision, document intelligence, and deployed research systems.</p>'
about += section('Education', grid(f'<article class="education-card"><h3>{esc(x[0])}</h3><p>{esc(x[1])}</p><p>{esc(x[2])} · {esc(x[3])}</p></article>' for x in DATA['education']), 'education')
about += section('Research Areas', '<ul>'+''.join(f'<li class="list-item">{esc(x)}</li>' for x in DATA['research_areas'])+'</ul>')
about += section('Research Experience', ''.join(f'<details class="experience-row"'+(' open' if i < 2 else '')+f'><summary><strong>{esc(x[0])}</strong><span>{esc(x[1])} · {esc(x[2])}</span></summary><p>{esc(x[4])}</p>'+ (f'<p class="card-meta">Supervisor / PI: {esc(x[3])}</p>' if x[3] else '')+'</details>' for i,x in enumerate(DATA['experience'])), 'experience')
about += section('M.Sc. Dissertation', card('Applications of Neural Network Operators in Image Processing', 'Studied activation functions and Gaussian interpolation for neural-network approximation and image reconstruction.', 'Completed · SVNIT · Dr. Shivam Bajpeyi · Grade: 10/10'))
about += section('Skills', '<div class="skills">'+''.join(f'<article class="skill-card"><h4>{esc(x[0])}</h4><p>{esc(x[1])}</p></article>' for x in DATA['skills'])+'</div>', 'skills')
about += section('Funding & Fellowships', grid(card(x[0], x[1]) for x in DATA['funding']))
about += section('Scholastic Achievements', '<ul>'+''.join(f'<li class="list-item">{esc(x)}</li>' for x in DATA['achievements'])+'</ul>')
about += section('Leadership & Responsibility', grid(card(x[0], x[2], x[1]) for x in DATA['leadership']))
about += section('Courses & Continuing Learning', grid(card(x[0], x[2], x[1]) for x in DATA['courses'])+'<div class="tag-list">'+''.join('<span>'+esc(x)+'</span>' for x in DATA['electives'])+'</div>'+link('https://drive.google.com/file/d/1GsPtWDuhoGoLSUJfbFx3dKq0RNszEx-h/view?usp=sharing','Full course list'))
about += section('Languages', '<p>Telugu: Bilingual proficiency · English: Working proficiency · Hindi: Conversational</p>')
about += section('Academic References', grid(card(x[0], x[1], '', x[2], 'Faculty profile') for x in DATA['references']))
finish(replace_container(template('About.html'), about), 'About.html')

pub = '<h1 class="page-title">Research Publications & Patent</h1><p class="section-intro">Image understanding, document intelligence, biometrics, and neural-network methods. Statuses reflect my latest CV.</p>'
pub += '<div class="summary-strip"><span><strong>2</strong> Accepted works</span><span><strong>5</strong> Submitted manuscripts</span><span><strong>1</strong> Published patent application</span></div>'
pub += '<div data-library>'+filterbar('Search research', [('all','All work'),('accepted','Accepted'),('submitted','Submitted / under review'),('patent','Patent application')])
pub += '<div class="publication-grid">'+''.join(f'<article class="publication-card" data-library-item data-category="{p["category"]}" id="{p["id"]}"><h4>{esc(p["title"])}</h4><p class="card-meta">{esc(p["authors"])}</p><p class="venue">{esc(p["venue"])}</p><p>{esc(p["summary"])}</p><p class="status">Status: {esc(p["status"])}</p><button type="button" class="compact-button" data-copy-citation>Copy reference</button></article>' for p in DATA['publications'])+'</div><p data-library-empty hidden>No matching work. Try another keyword or filter.</p><p class="action-status" data-copy-status role="status"></p></div>'
finish(replace_container(template('Publications.html').replace('<title>Resume', '<title>Publications'), pub), 'Publications.html')

projects = '<h1 class="page-title">Projects & Research Software</h1><p class="section-intro">From mathematical ideas to usable systems: deployed archival platforms, computer vision projects, and machine learning applications.</p><div data-library>'
projects += filterbar('Find a project', [('all','All projects'), ('Document AI','Document AI'), ('Computer Vision','Computer vision'), ('Machine Learning','Machine learning')])
projects += '<section class="packed-section" data-library-section><h2 class="section-title">Deployed Research Platforms</h2><div class="packed-grid">'+''.join(card(x[0], x[1], x[2], x[3], 'Open platform ↗', x[4]).replace('class="packed-card"','class="packed-card" data-library-item') for x in DATA['tools'])+'</div></section>'
projects += '<section class="packed-section" data-library-section><h2 class="section-title">Selected Projects</h2><div class="packed-grid">'+''.join(card(x[0], x[1], x[2], x[3], 'View source code ↗', x[4]).replace('class="packed-card"','class="packed-card" data-library-item') for x in DATA['projects'])+'</div></section><p data-library-empty hidden>No matching projects. Try another keyword or filter.</p></div>'
project_template = template('Publications.html').replace('<title>Resume -', '<title>Projects -').replace('<div class="logo-title">Publications</div>', '<div class="logo-title">Projects</div>')
finish(replace_container(project_template, projects), 'Projects.html')

reports = template('Reports.html')
reports = reports.replace('<div class="content-section">', '<h1 class="page-title">Reports, Notes & Articles</h1><p class="section-intro">Explore the reports and learning resources behind my research.</p><div data-library>'+filterbar('Search the library', [('all','All resources')])+'<div class="content-section">', 1)
reports = reports.replace('<div class="item">', '<div class="item" data-library-item>')
reports = reports.replace('Dynamic Block Scheduling Algorithm (DBSA) for high-performance computing tasks', 'Dynamic Batch Size Adjuster (DBSA) for efficient and stable deep learning training')
reports = re.sub(r'<!-- Update Section -->.*?(?=\n    </div>)', '<p data-library-empty hidden>No matching resources. Try another keyword.</p></div><div class="update-section"><h3>Research Software & Source Code</h3><p>Explore ShreeAkshara, ANVESHANA, Palm Leaf Denoiser, Kali-OMR, and my computer vision projects.</p>'+link('Projects.html','Explore projects & platforms')+'</div>', reports, flags=re.S)
reports = reports.replace('method="doPost"', 'method="post"')
reports = re.sub(r'action="https://script.google.com/[^\"]+"', 'action="mailto:'+DATA['email']+'"', reports)
reports = reports.replace('<span class="close-btn">&times;</span>', '<button type="button" class="close-btn" aria-label="Close comment dialog">&times;</button>')
reports = reports.replace('id="comment-modal" class="modal"', 'id="comment-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="comment-heading" tabindex="-1"')
reports = reports.replace('<h3>Leave a Comment</h3>', '<h3 id="comment-heading">Leave a Comment</h3><p class="comment-context" id="comment-context"></p>')
reports = reports.replace('name="comment" placeholder=', 'name="comment" aria-label="Your comment" placeholder=')
reports = reports.replace('>Submit</button>', '>Prepare email</button>')
reports = reports.replace('</form>', '<p class="comment-context">Prepare feedback for this resource, then open your email app to review and send it. Drafts are saved in this browser when storage is available.</p><p id="comment-status" role="status"></p><a class="button" id="comment-email" hidden>Open email app</a></form>')
finish(reports, 'Reports.html')

resume = '<h1 class="page-title">Curriculum Vitae</h1><div class="resume-section"><h2>Mahesh Rajarapu</h2><p>Ph.D. Researcher & Junior Research Fellow<br>Department of Computer Science and Engineering<br>Indian Institute of Technology Tirupati</p><p>Research: Document intelligence · Computer vision · Privacy-preserving systems · Face image quality</p><div class="compact-actions">'+link('assets/documents/Mahesh_CV.pdf','Download latest CV ↓','resume-button', True)+link('assets/documents/Mahesh_CV.pdf','Open PDF ↗','compact-button')+'</div><p class="card-meta">Full academic and research curriculum vitae.</p></div>'
resume += section('Academic Snapshot', grid(card(x[0], x[1], x[2]+' · '+x[3]) for x in DATA['education'][:2]))
resume += '<details class="pdf-preview"><summary>Preview the full CV</summary><iframe title="Mahesh Rajarapu curriculum vitae" data-pdf-src="assets/documents/Mahesh_CV.pdf#view=FitH"></iframe><p>'+link('assets/documents/Mahesh_CV.pdf','Open PDF if the preview is unavailable')+'</p></details>'
resume += section('Quick Links', '<div class="compact-actions">'+link('About.html#experience','Research experience')+link('Publications.html','Publications & patent')+link('Projects.html','Projects & software')+link('mailto:'+DATA['email'],'Email me')+'</div>')
resume += section('Contact', '<p>Tirupati, Andhra Pradesh, India<br>'+link('mailto:'+DATA['email'],DATA['email'])+' '+link('tel:+919652382413','+91 96523 82413')+'</p><div class="compact-actions">'+link('https://www.linkedin.com/in/rajarapu-mahesh-4ab06a1a9/','LinkedIn')+link('https://github.com/rajarapumahesh','GitHub')+link('https://leetcode.com/MaheshRajarapu/','LeetCode')+'</div>')
finish(replace_container(template('Resume.html'), resume), 'Resume.html')

talks = template('Talks.html').replace('<h1>Recent Talks & Presentations</h1>', '<h1>Talks & Presentations</h1><p class="section-intro">Sharing research, internship experiences, and community innovation.</p>')
talks = re.sub(r'<h3>[^<]*Low Cost Sanitary Pad Product Manufacturing Machine[^<]*</h3>', '<h3>Low-Cost Sanitary Pad Manufacturing Machine · UNNATI Mahotsav, IIT Delhi</h3>', talks)
talks = talks.replace('Delivered as part of the dissertation preliminaries,', 'Delivered during the preliminaries of my M.Sc. dissertation (completed in 2025 with a grade of 10/10),')
finish(talks, 'Talks.html')
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>https://rajarapumahesh.github.io/My-website/'+('' if p == 'index.html' else p)+'</loc></url>\n' for p,_ in NAV)+'</urlset>\n', encoding='utf-8')
print('Built 7 pages from the original-theme templates and latest CV data.')
