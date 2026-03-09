import os

BASE_STYLE = """
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg: #fafaf8; --surface: #ffffff; --border: #e8e8e4; --text: #1a1a18; --text-sub: #6b6b65; --text-muted: #9c9c94; --accent: #d97757; --accent-light: #fdf0eb; --accent-border: #f0c4b0; --green: #2d6a4f; --green-light: #edf7f2; --green-border: #a8d5bf; --amber: #9a6700; --amber-light: #fef9ec; --amber-border: #f0d080; --serif: Georgia,"Times New Roman",serif; --sans: -apple-system,"Segoe UI",sans-serif; }
    body { font-family: var(--sans); background: var(--bg); color: var(--text); font-size: 15px; line-height: 1.7; }
    .page-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 32px; }
    .page-header-inner { max-width: 860px; margin: 0 auto; height: 60px; display: flex; align-items: center; justify-content: space-between; }
    .site-name { font-family: var(--serif); font-size: 17px; color: var(--text); text-decoration: none; }
    .back-link { font-size: 13px; color: var(--text-sub); text-decoration: none; }
    main { max-width: 720px; margin: 0 auto; padding: 48px 32px 80px; }
    .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
    h1 { font-family: var(--serif); font-size: clamp(26px,4vw,38px); font-weight: 400; line-height: 1.2; color: var(--text); margin-bottom: 16px; }
    .intro { font-size: 16px; color: var(--text-sub); line-height: 1.75; margin-bottom: 32px; }
    h2 { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--text); margin: 44px 0 12px; }
    h3 { font-size: 14px; font-weight: 600; color: var(--text); margin: 20px 0 8px; }
    p { color: var(--text-sub); margin-bottom: 14px; }
    strong { color: var(--text); font-weight: 600; }
    a { color: var(--accent); }
    .divider { height: 1px; background: var(--border); margin: 36px 0; }
    .updated-tag { font-size: 12px; color: var(--text-muted); margin-top: 8px; margin-bottom: 40px; display: block; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 12px; margin: 24px 0; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; }
    .stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .stat-value { font-family: var(--serif); font-size: 24px; color: var(--text); line-height: 1; margin-bottom: 4px; }
    .stat-sub { font-size: 12px; color: var(--text-muted); }
    .highlight-box { background: var(--accent-light); border: 1px solid var(--accent-border); border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .highlight-box p { color: var(--text); margin-bottom: 0; }
    .info-box { background: var(--green-light); border: 1px solid var(--green-border); border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .info-box p { color: var(--green); margin-bottom: 0; }
    .warn-box { background: var(--amber-light); border: 1px solid var(--amber-border); border-radius: 10px; padding: 20px 24px; margin: 24px 0; }
    .warn-box p { color: var(--amber); margin-bottom: 0; }
    .check-list { list-style: none; margin: 16px 0; }
    .check-list li { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--text-sub); }
    .check-list li:last-child { border-bottom: none; }
    .tick { width: 20px; height: 20px; border-radius: 50%; background: var(--green-light); border: 1px solid var(--green-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px; color: var(--green); }
    .cross { width: 20px; height: 20px; border-radius: 50%; background: #fdf2f1; border: 1px solid #f5c6c2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px; color: #c0392b; }
    .steps { list-style: none; counter-reset: steps; margin: 20px 0; }
    .steps li { counter-increment: steps; display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--border); }
    .steps li:last-child { border-bottom: none; }
    .steps li::before { content: counter(steps); font-family: var(--serif); font-size: 18px; color: var(--accent); min-width: 28px; margin-top: 1px; }
    .steps li div { flex: 1; }
    .steps li strong { display: block; margin-bottom: 4px; color: var(--text); }
    .faq-item { padding: 20px 0; border-bottom: 1px solid var(--border); }
    .faq-item:last-child { border-bottom: none; }
    .faq-q { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    .faq-a { font-size: 14px; color: var(--text-sub); line-height: 1.7; margin: 0; }
    .cta-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 28px 32px; margin-top: 48px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .cta-title { font-family: var(--serif); font-size: 20px; color: var(--text); margin-bottom: 6px; }
    .cta-sub { font-size: 13px; color: var(--text-sub); }
    .cta-btn { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; }
    .breadcrumb { font-size: 13px; color: var(--text-muted); margin-bottom: 28px; }
    .breadcrumb a { color: var(--text-muted); text-decoration: none; }
    .breadcrumb span { margin: 0 8px; }
    .related-links { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 12px; margin: 24px 0; }
    .related-link { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; text-decoration: none; color: var(--text); font-size: 13px; }
    .related-link:hover { border-color: var(--accent); }
    .related-link-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    footer { border-top: 1px solid var(--border); padding: 24px 32px; font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 48px; }
    @media(max-width:600px){main{padding:32px 20px 60px;}.page-header{padding:0 20px;}.cta-box{padding:20px;flex-direction:column;}}
"""

ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1916647438314976" crossorigin="anonymous"></script>'

def page(filename, title, meta_desc, canonical, eyebrow, h1, intro, body_html, faq_items, related):
    faq_schema = ",".join([f'{{"@type":"Question","name":"{q}","acceptedAnswer":{{"@type":"Answer","text":"{a}"}}}}' for q,a in faq_items])
    related_html = "\n".join([f'<a href="/{slug}" class="related-link"><div class="related-link-label">{label}</div>{text}</a>' for slug,label,text in related])
    faq_html = "\n".join([f'<div class="faq-item"><div class="faq-q">{q}</div><p class="faq-a">{a}</p></div>' for q,a in faq_items])
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{meta_desc}" />
  <link rel="canonical" href="https://freechildcarehours.co.uk/{canonical}" />
  <meta property="og:title" content="{h1}" />
  <meta property="og:description" content="{meta_desc}" />
  <meta property="og:url" content="https://freechildcarehours.co.uk/{canonical}" />
  {ADSENSE}
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_schema}]}}</script>
  <style>{BASE_STYLE}</style>
</head>
<body>
<header class="page-header">
  <div class="page-header-inner">
    <a href="/" class="site-name">Free Childcare Hours</a>
    <a href="/" class="back-link">← Back to eligibility checker</a>
  </div>
</header>
<main>
  <nav class="breadcrumb"><a href="/">Home</a><span>›</span><a href="/guide">Guides</a><span>›</span><span>{eyebrow}</span></nav>
  <div class="eyebrow">{eyebrow} · Updated 2025</div>
  <h1>{h1}</h1>
  <p class="intro">{intro}</p>
  <span class="updated-tag">Last updated: March 2025 · Based on 2024/25 HMRC rules</span>
  {body_html}
  <h2>Frequently asked questions</h2>
  {faq_html}
  <div class="divider"></div>
  <h2>Related guides</h2>
  <div class="related-links">{related_html}</div>
  <div class="cta-box">
    <div><div class="cta-title">Check your eligibility now</div><div class="cta-sub">Use our free calculator to see if you qualify and how much you'll save.</div></div>
    <a href="/" class="cta-btn">Open the checker →</a>
  </div>
</main>
<footer><p>This guide is for informational purposes only. Always verify current rules at <a href="https://www.gov.uk/tax-free-childcare">gov.uk</a>. © 2025 freechildcarehours.co.uk</p></footer>
</body>
</html>"""
    with open(f"/home/claude/pages/{filename}.html", "w") as f:
        f.write(html)
    print(f"✓ {filename}.html")

# ── PAGE 2: Childcare Vouchers vs Tax-Free Childcare ──
page("tax-free-childcare-vs-vouchers",
"Tax-Free Childcare vs Childcare Vouchers: Which is Better? | freechildcarehours.co.uk",
"Comparing Tax-Free Childcare and the old Childcare Voucher scheme. Find out which saves you more money and whether you can switch. Updated 2024/25.",
"tax-free-childcare-vs-vouchers",
"Childcare Costs",
"Tax-Free Childcare vs Childcare Vouchers: Which is Better?",
"If you joined your employer's Childcare Voucher scheme before October 2018, you may still be receiving vouchers. But are they better than Tax-Free Childcare? Here's a clear comparison to help you decide.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">TFC max saving</div><div class="stat-value">£2,000</div><div class="stat-sub">Per child per year</div></div>
  <div class="stat-card"><div class="stat-label">Voucher max saving</div><div class="stat-value">~£933</div><div class="stat-sub">Basic rate taxpayer/year</div></div>
  <div class="stat-card"><div class="stat-label">TFC top-up rate</div><div class="stat-value">20%</div><div class="stat-sub">On up to £8,000/yr</div></div>
  <div class="stat-card"><div class="stat-label">Vouchers closed</div><div class="stat-value">Oct 2018</div><div class="stat-sub">No new sign-ups</div></div>
</div>
<h2>How Childcare Vouchers worked</h2>
<p>Childcare Vouchers were a salary sacrifice scheme available through employers until October 2018. Parents could sacrifice up to <strong>£243/month</strong> of their salary in exchange for vouchers, saving income tax and National Insurance on that amount. Basic rate taxpayers saved around <strong>£933/year</strong>, higher rate taxpayers saved up to <strong>£623/year</strong>.</p>
<p>If you joined a voucher scheme before October 2018, you can continue using it — but you cannot switch back once you leave, and no new parents can join.</p>
<h2>How Tax-Free Childcare works</h2>
<p>Tax-Free Childcare replaced vouchers as the government's main childcare support scheme. For every 80p you deposit into an HMRC online account, the government adds 20p — up to a maximum top-up of <strong>£2,000 per child per year</strong> (£4,000 for disabled children).</p>
<div class="highlight-box"><p><strong>Key difference:</strong> Tax-Free Childcare is per child, not per parent. A family with two children can receive up to £4,000/year in government top-ups. Childcare Vouchers were per parent — so two parents in voucher schemes could each save ~£933/year, totalling ~£1,866.</p></div>
<h2>Which saves more money?</h2>
<p>For most families, <strong>Tax-Free Childcare saves more</strong> — especially if you have two or more children, or high childcare costs. The breakeven point for a basic rate taxpayer with one child is roughly £9,333/year in childcare costs. Below that, vouchers may save more; above it, Tax-Free Childcare wins.</p>
<div class="warn-box"><p><strong>Important:</strong> You cannot use both schemes at the same time. If you're still on vouchers, carefully calculate your childcare spend before switching — you cannot rejoin the voucher scheme once you leave.</p></div>
<h2>Can you still get Childcare Vouchers?</h2>
<p>No new parents can join Childcare Voucher schemes. If you're not already enrolled with an employer scheme that was set up before October 2018, Tax-Free Childcare is your only option.</p>
""",
[
("Can I switch from Childcare Vouchers to Tax-Free Childcare?", "Yes, but you cannot switch back. Once you leave a voucher scheme you permanently lose access to it. Calculate carefully before switching."),
("Are Childcare Vouchers still available in 2024?", "Existing voucher scheme members can continue, but no new sign-ups have been possible since October 2018."),
("Does Tax-Free Childcare work with 30-hour free childcare?", "Yes — Tax-Free Childcare and the 30-hour entitlement work alongside each other. Childcare Vouchers also work alongside 30 hours.")
],
[("guide","Guide","Tax-Free Childcare Complete Guide"),("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Checker"),("how-to-apply-tax-free-childcare","How-to","How to Apply for Tax-Free Childcare")]
)

# ── PAGE 3: Salary Sacrifice & Childcare ──
page("salary-sacrifice-childcare",
"How Salary Sacrifice Affects Childcare Eligibility | freechildcarehours.co.uk",
"Pension, cycle to work, and electric car salary sacrifice can reduce your adjusted net income — protecting your 30-hour childcare eligibility. Here's how it works.",
"salary-sacrifice-childcare",
"Salary Sacrifice",
"How Salary Sacrifice Affects Your Childcare Eligibility",
"If your income is near — or over — £100,000, salary sacrifice schemes like pension contributions can reduce your adjusted net income and protect your eligibility for 30-hour childcare and Tax-Free Childcare. Here's exactly how it works.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Income limit</div><div class="stat-value">£100k</div><div class="stat-sub">Adjusted net per parent</div></div>
  <div class="stat-card"><div class="stat-label">Pension saving</div><div class="stat-value">Up to 60%</div><div class="stat-sub">Tax + NI saved per £1</div></div>
  <div class="stat-card"><div class="stat-label">Childcare value</div><div class="stat-value">£2,000+</div><div class="stat-sub">Per child per year</div></div>
</div>
<h2>The £100,000 problem</h2>
<p>If either parent has an adjusted net income above £100,000, your household loses eligibility for both <strong>30-hour free childcare</strong> and <strong>Tax-Free Childcare</strong>. This can cost families thousands of pounds per year.</p>
<p>But the limit is based on <strong>adjusted net income</strong> — not gross salary. This is the key insight. Salary sacrifice schemes reduce your adjusted net income, potentially restoring eligibility.</p>
<h2>Pension salary sacrifice</h2>
<p>Making pension contributions through salary sacrifice is the most powerful tool available. Every £1 you sacrifice reduces your adjusted net income by £1 — and between £100,000 and £125,140, you're effectively saving <strong>60p in tax per £1</strong> (due to the personal allowance taper).</p>
<div class="highlight-box"><p><strong>Example:</strong> Your gross salary is £108,000. You sacrifice £8,001 into your pension. Your adjusted net income drops to £99,999 — just below the £100,000 threshold. You restore 30-hour eligibility (worth ~£5,000+/year) and save ~£4,800 in income tax on the pension contribution itself.</p></div>
<h2>Cycle to Work scheme</h2>
<p>A Cycle to Work scheme lets you sacrifice salary to cover the cost of a bike and equipment. While the amounts are smaller (typically £1,000–£5,000), the sacrifice still reduces your adjusted net income and saves income tax and NI — making it an effective double saving.</p>
<h2>Electric car salary sacrifice</h2>
<p>Leasing an electric vehicle through your employer via salary sacrifice can reduce your adjusted net income by the full annual lease value. With Benefit in Kind rates at just 2% for pure EVs in 2024/25, this is often the most tax-efficient way to drive a new car — and it can make a meaningful difference to your childcare eligibility.</p>
<div class="warn-box"><p><strong>Watch out:</strong> Salary sacrifice reduces your gross pay, which can affect mortgage affordability assessments, life insurance calculations, and some state benefit entitlements. Always check the broader implications before entering a scheme.</p></div>
<h2>How to calculate your adjusted net income</h2>
<p>Adjusted net income = Gross income − Salary sacrifice pension contributions − Gift Aid donations − Trading losses. Use our calculator to see the impact of different sacrifice amounts on your eligibility.</p>
""",
[
("Does pension salary sacrifice count towards the £100,000 limit?","Pension contributions made via salary sacrifice reduce your adjusted net income — so yes, they reduce the figure used to assess the £100,000 childcare eligibility limit."),
("How much pension do I need to contribute to get under £100,000?","Subtract £100,000 from your adjusted net income. That's the minimum extra sacrifice needed. Our calculator shows the exact figure for your situation."),
("Does cycle to work affect childcare eligibility?","Yes — cycle to work sacrifice reduces your adjusted net income, which affects the £100,000 eligibility threshold. The effect is usually modest compared to pension sacrifice.")
],
[("adjusted-net-income","Tax","What is Adjusted Net Income?"),("pension-contributions-childcare","Pension","Pension & Childcare Eligibility"),("electric-car-salary-sacrifice-childcare","EV","EV Salary Sacrifice & Childcare")]
)

# ── PAGE 4: Childcare Term Dates ──
page("childcare-term-dates",
"30-Hour Childcare Term Dates 2025: When Does Eligibility Start? | freechildcarehours.co.uk",
"Find out exactly when your child becomes eligible for 30-hour free childcare based on their birthday. Term dates for 2025 explained clearly.",
"childcare-term-dates",
"Term Dates",
"30-Hour Childcare Term Dates 2025: When Does Your Child Become Eligible?",
"Your child doesn't become eligible for free childcare on their birthday — they become eligible from the start of the term following their birthday. Here's exactly how the term date system works and when your child will qualify.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Autumn term starts</div><div class="stat-value">1 Sep</div><div class="stat-sub">For birthdays 1 Apr–31 Aug</div></div>
  <div class="stat-card"><div class="stat-label">Spring term starts</div><div class="stat-value">1 Jan</div><div class="stat-sub">For birthdays 1 Sep–31 Dec</div></div>
  <div class="stat-card"><div class="stat-label">Summer term starts</div><div class="stat-value">1 Apr</div><div class="stat-sub">For birthdays 1 Jan–31 Mar</div></div>
</div>
<h2>How the term date system works</h2>
<p>In England, free childcare eligibility begins from the <strong>term following</strong> a child's relevant birthday — not on the birthday itself. There are three terms each year, starting on 1 January, 1 April, and 1 September.</p>
<div class="highlight-box"><p><strong>Example:</strong> Your child turns 3 on 15 May 2025. The next term start after that birthday is 1 September 2025. They become eligible from 1 September 2025 — not from 15 May.</p></div>
<h2>Term dates by birthday month — 3 and 4 year olds</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>Born 1 January – 31 March:</strong> Eligible from 1 April (summer term)</div></li>
  <li><span class="tick">✓</span><div><strong>Born 1 April – 31 August:</strong> Eligible from 1 September (autumn term)</div></li>
  <li><span class="tick">✓</span><div><strong>Born 1 September – 31 December:</strong> Eligible from 1 January (spring term)</div></li>
</ul>
<h2>Term dates for under-3s (expanded scheme from 2024)</h2>
<p>From September 2024, working parents of children aged 9 months and over are eligible for 15 free hours per week. The same term-date logic applies — eligibility starts from the term following the child's 9-month birthday.</p>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>9-month birthday 1 Jan – 31 Mar:</strong> Eligible from 1 April</div></li>
  <li><span class="tick">✓</span><div><strong>9-month birthday 1 Apr – 31 Aug:</strong> Eligible from 1 September</div></li>
  <li><span class="tick">✓</span><div><strong>9-month birthday 1 Sep – 31 Dec:</strong> Eligible from 1 January</div></li>
</ul>
<h2>When to apply</h2>
<p>Apply for your HMRC childcare code <strong>approximately 3 months before</strong> your child's eligibility date. This gives enough time for HMRC to process your application and for you to give the code to your childcare provider. Providers often need the code weeks before the term starts to plan their places.</p>
<div class="warn-box"><p><strong>Don't miss the window:</strong> If you apply too late, your provider may not be able to offer you a funded place until the following term. Apply early.</p></div>
""",
[
("When does my child become eligible for free childcare?","Children become eligible from the term following their relevant birthday. The three term start dates are 1 January, 1 April, and 1 September."),
("Do I need to reapply every term?","No — you apply once and receive a code. But you must reconfirm your eligibility with HMRC every 3 months or your code will lapse."),
("What if my child's birthday is right before a term starts?","If your child turns 3 on 28 August, they become eligible from 1 September — just days later. If they turn 3 on 2 September, they must wait until 1 January. The term date applies strictly.")
],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("how-to-apply-tax-free-childcare","How-to","How to Apply"),("guide","Guide","Tax-Free Childcare Guide")]
)

# ── PAGE 5: Adjusted Net Income ──
page("adjusted-net-income",
"What is Adjusted Net Income? The £100,000 Childcare Rule Explained | freechildcarehours.co.uk",
"Adjusted net income is the figure HMRC uses to assess your childcare eligibility. Here's exactly what it is, how to calculate it, and how to reduce it if you're near £100,000.",
"adjusted-net-income",
"Tax Rules",
"What is Adjusted Net Income? The £100,000 Childcare Rule Explained",
"HMRC uses your adjusted net income — not your gross salary — to assess eligibility for 30-hour childcare and Tax-Free Childcare. If your income is near £100,000, understanding this figure could save you thousands.",
"""
<h2>What is adjusted net income?</h2>
<p>Adjusted net income is your total taxable income minus certain allowable deductions. It's the figure HMRC uses for several means-tested calculations, including the <strong>£100,000 childcare eligibility limit</strong>, the personal allowance taper, and the High Income Child Benefit charge.</p>
<p>The formula is:</p>
<div class="highlight-box"><p><strong>Adjusted net income = Gross income − Salary sacrifice pension contributions − Gift Aid donations − Trading losses − Gross personal pension contributions</strong></p></div>
<h2>Why adjusted net income matters for childcare</h2>
<p>If either parent's adjusted net income exceeds <strong>£100,000</strong>, the household loses eligibility for both 30-hour free childcare and Tax-Free Childcare. Given the value of these schemes — potentially £5,000–£7,000+ per year — it's worth understanding exactly what counts.</p>
<h2>What reduces your adjusted net income?</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>Salary sacrifice pension contributions</strong> — the most effective reduction. Each £1 sacrificed reduces adjusted net income by £1.</div></li>
  <li><span class="tick">✓</span><div><strong>Gift Aid donations</strong> — the gross value of Gift Aid donations (i.e. what you gave ÷ 0.8) is deducted.</div></li>
  <li><span class="tick">✓</span><div><strong>Trading losses</strong> — if you're self-employed with a loss in the year, this reduces your adjusted net income.</div></li>
  <li><span class="cross">✕</span><div><strong>Bonus sacrifice</strong> — bonus sacrifice through salary sacrifice also reduces your adjusted net income.</div></li>
</ul>
<h2>The personal allowance trap between £100k and £125,140</h2>
<p>Between £100,000 and £125,140, your personal allowance is withdrawn at 50p for every £1 over £100,000. This creates an effective marginal tax rate of <strong>60%</strong> in this band — and it's also the zone where you lose childcare eligibility. This makes pension sacrifice in this income range exceptionally valuable.</p>
<div class="warn-box"><p><strong>Earning £105,000?</strong> You're paying 60% effective tax on £5,000 of income, and you've lost childcare worth potentially £5,000+/year. A pension sacrifice of £5,001 restores both your personal allowance and your childcare eligibility — worth well over £7,000 in combined benefit.</p></div>
<h2>How to find your adjusted net income</h2>
<p>HMRC's Self Assessment tax return calculates this automatically. If you're on PAYE, you can estimate it by taking your gross salary and subtracting any salary sacrifice contributions shown on your payslip. Our eligibility calculator does this calculation for you.</p>
""",
[
("Is adjusted net income the same as gross salary?","No. Adjusted net income is your gross income minus certain deductions including salary sacrifice pension contributions and Gift Aid donations. It is often lower than your gross salary."),
("Does bonus count towards the £100,000 limit?","Yes — bonuses are part of your taxable income and count towards adjusted net income. If a bonus pushes you over £100,000, you may lose childcare eligibility for that year."),
("Can my partner's income affect my childcare eligibility?","Both parents are assessed separately against the £100,000 limit. If either parent exceeds it, the household loses eligibility — but one partner's income doesn't add to the other's.")
],
[("salary-sacrifice-childcare","Tax","Salary Sacrifice & Childcare"),("pension-contributions-childcare","Pension","Pension Contributions Guide"),("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility")]
)

# ── PAGE 6: Free childcare on maternity leave ──
page("free-childcare-maternity-leave",
"Free Childcare on Maternity Leave: What Are Your Rights? | freechildcarehours.co.uk",
"Can you get 30-hour free childcare while on maternity leave? Yes — find out exactly how the maternity leave exception works and what you need to do.",
"free-childcare-maternity-leave",
"Maternity Leave",
"Can You Get 30-Hour Free Childcare on Maternity Leave?",
"Being on maternity leave doesn't disqualify you from 30-hour free childcare. In fact, the rules are specifically designed to protect parents on leave. Here's everything you need to know.",
"""
<div class="info-box"><p><strong>Good news:</strong> Parents on maternity leave, paternity leave, or shared parental leave automatically meet the minimum earnings requirement for 30-hour childcare and Tax-Free Childcare.</p></div>
<h2>The maternity leave exception</h2>
<p>Normally, both parents must earn at least <strong>£9,518 per year</strong> (16 hours at National Living Wage) to qualify for 30-hour free childcare. However, if a parent is on <strong>maternity leave, paternity leave, or shared parental leave</strong>, they are treated as meeting this minimum automatically — regardless of how much statutory pay they're receiving.</p>
<p>This means a family where one parent is on maternity leave and the other is working and meets the earnings threshold will qualify for the full 30-hour entitlement.</p>
<h2>What about the £100,000 income limit?</h2>
<p>The maternity leave exception only applies to the minimum earnings requirement — not the upper limit. If either parent has an adjusted net income above <strong>£100,000</strong> (based on their normal salary), the household still loses eligibility.</p>
<p>However, because salary sacrifice reduces adjusted net income, pension contributions made before or during maternity leave can help manage this.</p>
<h2>Keeping your Tax-Free Childcare account active during leave</h2>
<p>If you already have a Tax-Free Childcare account, it remains active during maternity leave. You must still <strong>reconfirm your eligibility every 3 months</strong> — the system will recognise you are on leave and confirm eligibility automatically.</p>
<div class="warn-box"><p><strong>Don't forget to reconfirm:</strong> If you miss the 3-month reconfirmation window, your account will be suspended. Set a reminder on your phone for each reconfirmation date.</p></div>
<h2>Applying for the first time while on maternity leave</h2>
<p>You can apply for 30-hour childcare and Tax-Free Childcare while on maternity leave. When HMRC asks about your earnings, indicate that you are on statutory maternity leave — the system will treat you as meeting the minimum earnings threshold.</p>
<h2>When your older child is already in childcare</h2>
<p>Many parents go on maternity leave while an older child is already receiving 30-hour childcare. Your eligibility for the older child continues during your leave — you just need to reconfirm as normal.</p>
""",
[
("Do I qualify for 30 hours free childcare on maternity leave?","Yes. Parents on maternity leave automatically meet the minimum earnings threshold. As long as the other parent is working and meets the income criteria, and neither earns over £100,000, you qualify."),
("What if I'm self-employed on maternity leave?","Self-employed parents on maternity leave are also covered by the exception. You should indicate your leave status when applying or reconfirming with HMRC."),
("Does adoption leave count the same as maternity leave?","Yes — adoption leave is treated the same as maternity leave for childcare eligibility purposes.")
],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("free-childcare-single-parents","Single Parents","Free Childcare for Single Parents"),("guide","Guide","Tax-Free Childcare Complete Guide")]
)

# ── PAGE 7: Free childcare self-employed ──
page("free-childcare-self-employed",
"Free Childcare for Self-Employed Parents: Eligibility & How to Apply | freechildcarehours.co.uk",
"Self-employed parents can qualify for 30-hour free childcare and Tax-Free Childcare. Find out how HMRC assesses your earnings and what you need to do.",
"free-childcare-self-employed",
"Self-Employed",
"Free Childcare for Self-Employed Parents: Everything You Need to Know",
"Being self-employed doesn't stop you from claiming 30-hour free childcare or Tax-Free Childcare. But HMRC assesses your earnings differently. Here's exactly how it works.",
"""
<h2>Do self-employed parents qualify?</h2>
<p>Yes — self-employed parents are eligible for both 30-hour free childcare and Tax-Free Childcare, provided they meet the same income criteria as employed parents. The key difference is how HMRC assesses your earnings.</p>
<h2>How HMRC assesses self-employed earnings</h2>
<p>Rather than looking at payslips, HMRC asks self-employed applicants to estimate their <strong>expected earnings for the next three months</strong>. You need to show that your expected profit meets the minimum threshold of approximately <strong>£2,380 per quarter</strong> (£9,518 annualised).</p>
<div class="highlight-box"><p><strong>Important:</strong> HMRC uses expected profit, not turnover. If your business expenses are high relative to your income, make sure you're calculating your net profit correctly when estimating your quarterly earnings.</p></div>
<h2>What if my income fluctuates?</h2>
<p>Seasonal or irregular income is common in self-employment. HMRC understands this and looks at your expected earnings over the coming quarter. If you have a slow quarter but expect your annual earnings to meet the threshold, you can still be eligible.</p>
<p>However, if HMRC later finds your actual earnings were significantly below what you declared, they may ask for repayment of any government top-ups received.</p>
<h2>The start-up exception</h2>
<p>If you have recently started a business and your earnings haven't yet reached the minimum threshold, you may still qualify. HMRC has a <strong>start-up period exception</strong> — newly self-employed parents can be eligible even if their current earnings are below the minimum, as long as they're working towards building their business.</p>
<h2>The £100,000 upper limit</h2>
<p>Self-employed parents are subject to the same £100,000 adjusted net income cap. Trading losses can reduce your adjusted net income, and pension contributions to a SIPP (Self-Invested Personal Pension) can also reduce your adjusted net income and protect eligibility.</p>
<div class="warn-box"><p><strong>Making a loss?</strong> If your business makes a loss in a tax year, this reduces your adjusted net income — which could actually help if your combined income from other sources is near the £100,000 limit.</p></div>
""",
[
("Can I claim Tax-Free Childcare if I'm self-employed?","Yes — self-employed parents are eligible as long as your expected quarterly profit meets the minimum earnings threshold of around £2,380."),
("What if I earn less than the minimum some months?","HMRC assesses on a quarterly basis. As long as your expected earnings for the coming quarter meet the minimum, temporary low-income months don't disqualify you."),
("Can both self-employed parents qualify?","Yes — if both parents are self-employed and both meet the minimum earnings threshold, the household qualifies in the same way as two employed parents.")
],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("adjusted-net-income","Tax","What is Adjusted Net Income?"),("guide","Guide","Tax-Free Childcare Guide")]
)

# ── PAGE 8: Free childcare single parents ──
page("free-childcare-single-parents",
"Free Childcare for Single Parents: 30 Hours & Tax-Free Childcare | freechildcarehours.co.uk",
"Single parents can qualify for 30-hour free childcare and Tax-Free Childcare. Find out the income rules and how they differ from two-parent households.",
"free-childcare-single-parents",
"Single Parents",
"30-Hour Free Childcare for Single Parents: What You're Entitled To",
"Single parents are fully eligible for 30-hour free childcare and Tax-Free Childcare — and only need to meet the income criteria themselves, not as a couple. Here's what you're entitled to.",
"""
<div class="info-box"><p><strong>Single parent advantage:</strong> Only you need to meet the minimum earnings threshold — not a second parent. And only your income is assessed against the £100,000 upper limit.</p></div>
<h2>Single parent eligibility rules</h2>
<p>In a single-parent household, the eligibility rules are simpler: only <strong>you</strong> need to be working and meeting the income requirements. There's no second parent to worry about.</p>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>You are working</strong> — employed, self-employed, or on leave</div></li>
  <li><span class="tick">✓</span><div><strong>You earn at least £9,518/year</strong> — or are on maternity/parental leave</div></li>
  <li><span class="tick">✓</span><div><strong>Your adjusted net income is under £100,000</strong></div></li>
  <li><span class="tick">✓</span><div><strong>Your child is the right age</strong> — 3 or 4 years old (or 9 months+ under the expanded scheme)</div></li>
</ul>
<h2>What counts as a single-parent household?</h2>
<p>For HMRC's purposes, you're a single parent if you are the sole claimant and there is no partner living with you. If you share care of the child with an ex-partner, you can still claim as a single parent — but only one parent can hold the childcare code for a given child at any time.</p>
<h2>Shared care arrangements</h2>
<p>If your child splits time between two households, each parent can have their own Tax-Free Childcare account — but only one 30-hour code can be used per child. Typically the primary carer holds the code. It's worth discussing with your childcare provider who the code is registered to.</p>
<h2>Universal Credit and free childcare</h2>
<p>If you receive Universal Credit, you may be entitled to support with childcare costs through UC rather than (or in addition to) Tax-Free Childcare. UC can cover up to 85% of eligible childcare costs. You generally cannot receive both UC childcare support and Tax-Free Childcare top-ups for the same costs — choose the more beneficial option.</p>
<div class="warn-box"><p><strong>Universal Credit claimants:</strong> Check carefully which scheme gives you more benefit before applying for Tax-Free Childcare. If UC covers 85% of your costs, it may be worth more than the 20% TFC top-up.</p></div>
""",
[
("Can single parents get 30 hours free childcare?","Yes — single parents are fully eligible. Only you need to meet the income criteria. There's no requirement for a second parent to be working."),
("What if I work part-time?","As long as your part-time earnings meet the minimum threshold of £9,518 per year (equivalent to 16 hours at National Living Wage), you qualify."),
("Can I get free childcare if my ex-partner earns over £100,000?","Your ex-partner's income is not assessed for your eligibility. Only your adjusted net income counts — as long as you're under £100,000, you qualify regardless of your ex-partner's earnings.")
],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("free-childcare-maternity-leave","Maternity","Free Childcare on Maternity Leave"),("guide","Guide","Tax-Free Childcare Guide")]
)

# ── PAGE 9: How to apply ──
page("how-to-apply-tax-free-childcare",
"How to Apply for Tax-Free Childcare and 30-Hour Free Childcare | freechildcarehours.co.uk",
"Step-by-step guide to applying for Tax-Free Childcare and 30-hour free childcare via HMRC. What you need, how long it takes, and what happens next.",
"how-to-apply-tax-free-childcare",
"Applying",
"How to Apply for Tax-Free Childcare and 30-Hour Free Childcare",
"Applying for Tax-Free Childcare and the 30-hour entitlement is done through the same HMRC portal in one application. Here's a clear step-by-step guide to the process.",
"""
<h2>What you'll need before you start</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div>Your <strong>National Insurance number</strong></div></li>
  <li><span class="tick">✓</span><div>Your child's <strong>date of birth</strong></div></li>
  <li><span class="tick">✓</span><div>Details of your <strong>employer or self-employment</strong></div></li>
  <li><span class="tick">✓</span><div>Your <strong>Government Gateway login</strong> (or set one up — it takes 5 minutes)</div></li>
  <li><span class="tick">✓</span><div>Your partner's details if applicable</div></li>
</ul>
<h2>Step-by-step application</h2>
<ol class="steps">
  <li><div><strong>Go to gov.uk/tax-free-childcare</strong><br>This is the official HMRC portal. Don't use any third-party sites.</div></li>
  <li><div><strong>Sign in or create a Government Gateway account</strong><br>If you don't have one, it takes about 5 minutes to set up. You'll need your National Insurance number and a form of ID verification.</div></li>
  <li><div><strong>Apply for Tax-Free Childcare and/or 30 hours</strong><br>You can apply for both in the same application. HMRC will ask about your work situation, expected earnings, and your child's details.</div></li>
  <li><div><strong>Receive your eligibility confirmation</strong><br>Most applications are approved instantly. You'll receive a childcare account number (for Tax-Free Childcare) and a 30-hour code (for the free hours).</div></li>
  <li><div><strong>Give your 30-hour code to your provider</strong><br>Your nursery or childminder needs this code to claim the funded hours from the government. Give it to them well before the term starts.</div></li>
  <li><div><strong>Top up your Tax-Free Childcare account</strong><br>Deposit money into your online account. The government top-up (20%) is added automatically, usually within 24 hours. Pay your provider directly from the account.</div></li>
  <li><div><strong>Reconfirm every 3 months</strong><br>HMRC sends a reminder. Log in and confirm you're still eligible. It takes 2 minutes. Missing this window suspends your account.</div></li>
</ol>
<div class="warn-box"><p><strong>Apply early:</strong> Apply at least 3 months before your child's eligibility date. Providers often need the code weeks before the term starts to allocate places.</p></div>
<h2>How long does approval take?</h2>
<p>Most online applications are approved <strong>instantly or within 24 hours</strong>. In some cases HMRC may request additional information, which can take a few days. Applications submitted close to the term start date may not be processed in time for the first term.</p>
""",
[
("How long does Tax-Free Childcare take to set up?","Most applications are approved instantly online. Once approved you can start depositing money and the government top-up appears within 24 hours."),
("Can I apply before my child is born?","No — you need your child's date of birth to apply. Apply as soon as your child is born and is approaching the eligible age."),
("What happens if I miss the 3-month reconfirmation?","Your account is suspended. You can reactivate it by logging in and completing the reconfirmation — but there may be a gap in your funded hours while the code is suspended.")
],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("childcare-term-dates","Dates","Term Dates 2025"),("guide","Guide","Tax-Free Childcare Guide")]
)

# ── PAGE 10: Pension contributions and childcare ──
page("pension-contributions-childcare",
"Pension Contributions and Childcare Eligibility: How to Stay Under £100,000 | freechildcarehours.co.uk",
"Pension salary sacrifice reduces your adjusted net income — which can protect your 30-hour childcare eligibility if your income is near £100,000. Here's how to calculate the right contribution.",
"pension-contributions-childcare",
"Pension",
"How Pension Contributions Protect Your Childcare Eligibility",
"If your income is near — or above — £100,000, increasing your pension contributions is one of the most powerful financial moves available. It saves tax, builds your retirement fund, and can unlock thousands in childcare benefits.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Effective tax rate</div><div class="stat-value">Up to 60%</div><div class="stat-sub">Saved per £1 sacrificed at £100k–£125k</div></div>
  <div class="stat-card"><div class="stat-label">Childcare value</div><div class="stat-value">£5,000+</div><div class="stat-sub">30-hour entitlement per year</div></div>
  <div class="stat-card"><div class="stat-label">TFC value</div><div class="stat-value">£2,000</div><div class="stat-sub">Per child, per year</div></div>
</div>
<h2>Why pension sacrifice is so powerful near £100,000</h2>
<p>Between £100,000 and £125,140, your personal allowance is withdrawn at a rate of 50p for every £1 over £100,000. This creates an effective marginal income tax rate of <strong>60%</strong> in this band. Every pound you sacrifice into your pension saves you 60p in income tax — and also reduces your adjusted net income towards the childcare eligibility threshold.</p>
<h2>Calculating how much to contribute</h2>
<p>To find the minimum additional pension contribution needed to restore eligibility:</p>
<div class="highlight-box"><p><strong>Additional contribution needed = Your adjusted net income − £100,000</strong><br><br>For example: adjusted net income of £107,000 → needs £7,001 of additional pension sacrifice to bring it to £99,999.</p></div>
<h2>Salary sacrifice vs personal contributions</h2>
<p><strong>Salary sacrifice</strong> (arranged through your employer) is more tax-efficient because it also saves National Insurance — both yours and your employer's. The NI saving on salary sacrifice can be an additional 8–10% on top of the income tax saving.</p>
<p><strong>Personal pension contributions</strong> (direct to a pension provider) also reduce your adjusted net income, but don't save NI. They still count for the £100,000 threshold calculation — HMRC applies basic rate tax relief at source, and you claim the additional relief through Self Assessment.</p>
<h2>The combined benefit calculation</h2>
<p>Consider a parent earning £108,000 who sacrifices £8,001 into their pension:</p>
<ul class="check-list">
  <li><span class="tick">✓</span><div>Saves approximately <strong>£4,800 in income tax</strong> (60% rate on £8,001)</div></li>
  <li><span class="tick">✓</span><div>Saves approximately <strong>£640 in National Insurance</strong> (8% on £8,001)</div></li>
  <li><span class="tick">✓</span><div>Restores <strong>30-hour childcare</strong> worth ~£5,000–£7,000/year</div></li>
  <li><span class="tick">✓</span><div>Restores <strong>Tax-Free Childcare</strong> worth up to £2,000/year per child</div></li>
  <li><span class="tick">✓</span><div>Restores <strong>personal allowance</strong> — saving a further £5,028 in tax</div></li>
</ul>
<div class="info-box"><p><strong>Total benefit:</strong> A £8,001 pension contribution can generate over £17,000 in combined tax savings and childcare benefits for a family in this situation.</p></div>
""",
[
("Does pension salary sacrifice reduce adjusted net income?","Yes — pension contributions made via salary sacrifice reduce your adjusted net income pound-for-pound, which is the figure used to assess the £100,000 childcare eligibility limit."),
("Can I make a lump sum pension contribution to get under £100,000?","Yes — personal pension contributions made before 31 January following the tax year end can reduce your adjusted net income for that year via Self Assessment."),
("Does my employer pension contribution count?","Employer contributions do not affect your adjusted net income — only employee contributions (whether salary sacrifice or personal) reduce your figure.")
],
[("salary-sacrifice-childcare","Tax","Salary Sacrifice & Childcare"),("adjusted-net-income","Tax","What is Adjusted Net Income?"),("electric-car-salary-sacrifice-childcare","EV","EV Salary Sacrifice & Childcare")]
)

print("\nAll pages done!")
