#!/usr/bin/env python3
"""Generate crawlable /research/<name>.html pages from research/*.md.
Run: python3 tools/generate_research_pages.py"""
import os, re, html, glob

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RESEARCH = os.path.join(REPO, 'research')
OUT = os.path.join(REPO, 'research')
EXCLUDE = {'architect-notes.md'}

NAV = '''<nav class="nav"><a href="/" class="nav-item">Home</a><a href="/live" class="nav-item">Live Fees</a><a href="/learn" class="nav-item">Learn</a><a href="/capacity" class="nav-item">Capacity</a><a href="/fork-tracker" class="nav-item">Fork Tracker</a><span class="nav-item active">Research</span></nav>'''

STYLE = '''body{background:#1A1612;color:#E8E5E0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0}
header{background:#231F19;border-bottom:1px solid #3A3228;padding:16px 24px}
.header-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.brand{color:#F7931A;font-weight:700;text-decoration:none;font-size:1.1rem}
.nav{display:flex;gap:14px;align-items:center}
.nav-item{padding:6px 14px;font-size:.875rem;font-weight:500;color:#9B8B78;border-radius:6px;text-decoration:none;transition:all .2s}
.nav-item:hover{color:#EADCC8;background:#2A251E}
.nav-item.active{background:#2A251E;color:#EADCC8}
.container{max-width:960px;margin:0 auto;padding:40px 24px 80px}
h1{color:#F7931A;font-size:1.9rem;margin:0 0 8px}
h2{color:#EADCC8;font-size:1.3rem;margin:28px 0 12px}
h3{color:#EADCC8;font-size:1.1rem;margin:20px 0 8px}
p{color:#C9C2B8;line-height:1.8;margin:0 0 14px}
a{color:#D4933A}
table{border-collapse:collapse;margin:14px 0;width:100%}
th,td{border:1px solid #3A3228;padding:8px 12px;text-align:left;font-size:.9rem}
th{background:#231F19;color:#EADCC8}
blockquote{border-left:3px solid #F7931A;margin:14px 0;padding:4px 16px;color:#9B8B78;background:#1F1B16}
pre,code{background:#231F19;border-radius:6px;font-family:'SF Mono',Menlo,monospace}
pre{padding:14px;overflow-x:auto}
code{padding:2px 5px;font-size:.88em}
ul,ol{color:#C9C2B8;line-height:1.7;padding-left:24px}
hr{border:none;border-top:1px solid #3A3228;margin:24px 0}
footer{border-top:1px solid #3A3228;padding:24px;text-align:center;font-size:.85rem;color:#6A5D4E}
footer .links{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:10px}
footer .links a{color:#6A5D4E;text-decoration:none}
footer .links a:hover{color:#D4933A}'''


def inline(s):
    s = html.escape(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    return s


def render_md(text):
    lines = text.split('\n')
    out = []
    i = 0
    in_code = False
    code_buf = []
    table_buf = []
    in_table = False
    in_ul = False
    in_ol = False

    def flush_table():
        nonlocal table_buf, in_table
        if table_buf:
            rows = [r for r in table_buf if r]
            if len(rows) >= 2:
                out.append('<table>')
                for ri, r in enumerate(rows):
                    cells = [c.strip() for c in r.strip().strip('|').split('|')]
                    tag = 'th' if ri == 0 else 'td'
                    out.append('<tr>' + ''.join('<' + tag + '>' + inline(c) + '</' + tag + '>' for c in cells) + '</tr>')
                out.append('</table>')
            table_buf = []
            in_table = False

    while i < len(lines):
        line = lines[i]
        if line.strip().startswith('```'):
            if in_code:
                out.append('<pre><code>' + html.escape('\n'.join(code_buf)) + '</code></pre>')
                code_buf = []
                in_code = False
            else:
                flush_table()
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue
        if line.strip().startswith('|'):
            in_table = True
            table_buf.append(line)
            i += 1
            continue
        flush_table()
        s = line.strip()
        if not s:
            i += 1
            continue
        m = re.match(r'^(#{1,3})\s+(.*)', s)
        if m:
            # Demote: page title is the H1, so md #->h2, ##->h3, ###->h4
            lvl = min(len(m.group(1)) + 1, 4)
            out.append('<h' + str(lvl) + '>' + inline(m.group(2)) + '</h' + str(lvl) + '>')
        elif s == '---':
            out.append('<hr>')
        elif s.startswith('> '):
            out.append('<blockquote>' + inline(s[2:]) + '</blockquote>')
        elif re.match(r'^(-|\*)\s+', s):
            if not in_ul: out.append('<ul>')
            out.append('<li>' + inline(re.sub(r'^(-|\*)\s+', '', s)) + '</li>')
            in_ul = True
        elif re.match(r'^\d+\.\s+', s):
            if not in_ol: out.append('<ol>')
            out.append('<li>' + inline(re.sub(r'^\d+\.\s+', '', s)) + '</li>')
            in_ol = True
        else:
            if in_ul: out.append('</ul>'); in_ul = False
            if in_ol: out.append('</ol>'); in_ol = False
            out.append('<p>' + inline(s) + '</p>')
        i += 1
    flush_table()
    if in_ul: out.append('</ul>')
    if in_ol: out.append('</ol>')
    if in_code:
        out.append('<pre><code>' + html.escape('\n'.join(code_buf)) + '</code></pre>')
    return '\n'.join(out)


def humanize(name):
    return name.replace('_', ' ').replace('.md', '').title()


def first_para(text):
    for line in text.split('\n'):
        s = line.strip()
        if s and not s.startswith('#'):
            return html.unescape(re.sub(r'\*\*|__|`', '', s))
    return ''


def make_desc(title, first_para_text):
    d = first_para_text or title
    d = html.unescape(re.sub(r'\*\*|__|`|\[|\]', '', d))
    # Pad to 140+ chars with a research suffix if needed
    suffix = ' Bitcoin block space economics research from BSAHI — live fee, mempool, and settlement data from the autonomous research engine.'
    while len(d) < 140:
        d = d + suffix
    return d[:165]


def make_page(name, title, desc, body, breadcrumb):
    return '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="''' + html.escape(desc[:160]) + '''">
<meta property="og:title" content="''' + title + '''">
<meta property="og:type" content="article">
<meta property="og:url" content="https://bitcoinsahi.com/research/''' + name + '''.html">
<meta property="og:image" content="https://bitcoinsahi.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1A1612">
<link rel="canonical" href="https://bitcoinsahi.com/research/''' + name + '''.html">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://bitcoinsahi.com/"},{"@type":"ListItem","position":2,"name":"Research","item":"https://bitcoinsahi.com/research/"},{"@type":"ListItem","position":3,"name":"''' + title + '''","item":"https://bitcoinsahi.com/research/''' + name + '''.html"}]}
</script>
<title>''' + title + ''' — BSAHI Research</title>
<style>''' + STYLE + '''</style>
</head>
<body>
<header><div class="header-inner"><a href="/" class="brand">⬡ BSAHI</a>''' + NAV + '''</div></header>
<div class="container">
<h1>''' + title + '''</h1>
''' + body + '''
<p style="margin-top:32px;"><a href="/research">← All research</a> · <a href="/learn">← Back to Learn</a></p>
</div>
<footer><div class="links"><a href="/">Home</a><a href="/live">Decide</a><a href="/learn">Learn</a><a href="/capacity">Capacity</a><a href="/fork-tracker">Fork</a><a href="/research">Research</a></div><div>Bitcoin Sahi — research and decision platform for the Bitcoin block space economy</div></footer>
</body>
</html>
'''


def main():
    files = sorted(glob.glob(os.path.join(RESEARCH, '*.md')))
    files = [f for f in files if os.path.basename(f) not in EXCLUDE]
    summaries = []
    for f in files:
        name = os.path.splitext(os.path.basename(f))[0]
        with open(f) as fh:
            text = fh.read()
        title = humanize(name)
        desc = make_desc(title, first_para(text))
        body = render_md(text)
        page = make_page(name, title, desc, body, None)
        with open(os.path.join(OUT, name + '.html'), 'w') as fh:
            fh.write(page)
        summaries.append((name, title, first_para(text)))
        print('wrote', name + '.html')

    # index page
    items = ''.join(
        '<li><a href="/research/%s.html">%s</a> — %s</li>' % (n, t, html.escape(d[:120]))
        for n, t, d in summaries
    )
    index = '''<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="The BSAHI open research library on Bitcoin block space economics — fees, mempool, and settlement analysis from live Bitcoin network data, updated continuously.">
<meta property="og:title" content="BSAHI Research">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://bitcoinsahi.com/"},{"@type":"ListItem","position":2,"name":"Research","item":"https://bitcoinsahi.com/research/"}]}
</script>
<meta property="og:url" content="https://bitcoinsahi.com/research/">
<meta property="og:image" content="https://bitcoinsahi.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://bitcoinsahi.com/research/">
<title>BSAHI Research — Block Space Economics</title>
<style>''' + STYLE + '''</style></head>
<body>
<header><div class="header-inner"><a href="/" class="brand">⬡ BSAHI</a>''' + NAV + '''</div></header>
<div class="container">
<h1>BSAHI Research</h1>
<p>Open research on Bitcoin block space economics — the fee market, mempool dynamics, and the permanent cost of data storage.</p>
<ul>''' + items + '''</ul>
<p style="margin-top:32px;"><a href="/learn">← Back to Learn</a></p>
</div>
<footer><div class="links"><a href="/">Home</a><a href="/live">Decide</a><a href="/learn">Learn</a><a href="/capacity">Capacity</a><a href="/fork-tracker">Fork</a><a href="/research">Research</a></div><div>Bitcoin Sahi — research and decision platform for the Bitcoin block space economy</div></footer>
</body>
</html>
'''
    with open(os.path.join(OUT, 'index.html'), 'w') as fh:
        fh.write(index)
    print('wrote index.html')


if __name__ == '__main__':
    main()
