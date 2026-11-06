# Renders docs/agreements/*.html to one-page Letter PDFs with headless Chrome. Run: python tools/render-agreement.py
import glob, os, subprocess
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
for src in glob.glob('docs/agreements/*.html'):
    src = os.path.abspath(src)
    out = src[:-5] + '.pdf'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000',
                    f'--print-to-pdf={out}', 'file:///' + src.replace('\\', '/')], check=True, capture_output=True)
    print(out)
