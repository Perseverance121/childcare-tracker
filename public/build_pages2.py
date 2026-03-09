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
  <meta property="og:title" content="{h1}" /><meta property="og:description" content="{meta_desc}" />
  {ADSENSE}
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_schema}]}}</script>
  <style>{BASE_STYLE}</style>
</head>
<body>
<header class="page-header"><div class="page-header-inner"><a href="/" class="site-name">Free Childcare Hours</a><a href="/" class="back-link">← Back to eligibility checker</a></div></header>
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
  <div class="cta-box"><div><div class="cta-title">Check your eligibility now</div><div class="cta-sub">Use our free calculator to see if you qualify and how much you'll save.</div></div><a href="/" class="cta-btn">Open the checker →</a></div>
</main>
<footer><p>For informational purposes only. Verify at <a href="https://www.gov.uk/tax-free-childcare">gov.uk</a>. © 2025 freechildcarehours.co.uk</p></footer>
</body></html>"""
    with open(f"/home/claude/pages/{filename}.html", "w") as f:
        f.write(html)
    print(f"✓ {filename}.html")

# PAGE 11: EV salary sacrifice
page("electric-car-salary-sacrifice-childcare",
"Electric Car Salary Sacrifice and Childcare Eligibility | freechildcarehours.co.uk",
"How leasing an electric car through salary sacrifice reduces your adjusted net income and can protect your 30-hour childcare eligibility. Updated 2024/25 BIK rates.",
"electric-car-salary-sacrifice-childcare","Electric Car","How Electric Car Salary Sacrifice Affects Your Childcare Eligibility",
"Leasing an electric vehicle through your employer via salary sacrifice reduces your adjusted net income — which can protect your eligibility for 30-hour free childcare if your income is near £100,000.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">EV BIK rate 2024/25</div><div class="stat-value">2%</div><div class="stat-sub">Of P11D value</div></div>
  <div class="stat-card"><div class="stat-label">EV BIK rate 2025/26</div><div class="stat-value">3%</div><div class="stat-sub">Of P11D value</div></div>
  <div class="stat-card"><div class="stat-label">Income tax saved</div><div class="stat-value">20–60%</div><div class="stat-sub">On sacrificed lease amount</div></div>
</div>
<h2>How electric car salary sacrifice works</h2>
<p>With an electric car salary sacrifice scheme, your employer leases a car on your behalf. You sacrifice an equivalent amount of your gross salary each month in exchange for the use of the vehicle. Because your gross salary is reduced, so is your <strong>adjusted net income</strong> — which is the figure HMRC uses to assess your childcare eligibility.</p>
<h2>The Benefit in Kind tax</h2>
<p>When you receive a company car, HMRC charges a Benefit in Kind (BIK) tax. For pure electric vehicles, this is just <strong>2% of the car's P11D value in 2024/25</strong>, rising to 3% in 2025/26. This is exceptionally low compared to petrol or diesel vehicles.</p>
<div class="highlight-box"><p><strong>Example:</strong> Your gross salary is £104,000. You sacrifice £500/month (£6,000/year) for an electric car with a P11D of £40,000. Your adjusted net income falls to £98,000. BIK tax: £40,000 × 2% × 40% = £320/year. Net benefit: eligibility restored + significant tax saving on the lease.</p></div>
<h2>The childcare eligibility impact</h2>
<p>For parents whose adjusted net income is slightly above £100,000, an EV sacrifice scheme can be enough to restore eligibility. The lease value reduces your adjusted net income pound-for-pound, with only a small BIK tax charge offsetting the benefit.</p>
<h2>Combining with pension sacrifice</h2>
<p>EV salary sacrifice and pension salary sacrifice can be combined. Both reduce your adjusted net income, and together they can bring higher earners comfortably below the £100,000 threshold while maximising the tax efficiency of their overall pay package.</p>
<div class="warn-box"><p><strong>Check your employer:</strong> Not all employers offer EV salary sacrifice schemes. If yours doesn't, pension contributions remain the most accessible way to reduce your adjusted net income.</p></div>
""",
[("Does EV salary sacrifice reduce adjusted net income?","Yes — the salary you sacrifice for the car lease reduces your gross pay and therefore your adjusted net income, which HMRC uses to assess the £100,000 childcare eligibility limit."),
("Is BIK tax charged on the salary sacrifice saving?","Yes — you pay BIK tax on the car's P11D value multiplied by the BIK rate. For pure EVs this is just 2% of P11D in 2024/25, making the net saving very favourable."),
("Can I use EV sacrifice and pension sacrifice together?","Yes — both reduce your adjusted net income. Combining them can bring higher earners below the £100,000 threshold more efficiently.")],
[("salary-sacrifice-childcare","Tax","Salary Sacrifice & Childcare"),("pension-contributions-childcare","Pension","Pension & Childcare"),("adjusted-net-income","Tax","What is Adjusted Net Income?")]
)

# PAGE 12: 15 vs 30 hours
page("15-hours-vs-30-hours-free-childcare",
"15 Hours vs 30 Hours Free Childcare: What's the Difference? | freechildcarehours.co.uk",
"All 3 and 4 year olds get 15 hours free childcare. Working parents can get 30 hours. Here's the difference, who qualifies for each, and how to get the most from both.",
"15-hours-vs-30-hours-free-childcare","Free Childcare Hours","15 Hours vs 30 Hours Free Childcare: What's the Difference?",
"All 3 and 4 year olds in England are entitled to 15 hours of free childcare. But working parents can double this to 30 hours. Here's how both entitlements work and how to claim them.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Universal entitlement</div><div class="stat-value">15 hrs</div><div class="stat-sub">All 3-4 year olds</div></div>
  <div class="stat-card"><div class="stat-label">Working parents</div><div class="stat-value">30 hrs</div><div class="stat-sub">Eligible working parents</div></div>
  <div class="stat-card"><div class="stat-label">Term weeks</div><div class="stat-value">38</div><div class="stat-sub">Per year for both</div></div>
  <div class="stat-card"><div class="stat-label">Total annual hours</div><div class="stat-value">1,140</div><div class="stat-sub">At 30 hours/week</div></div>
</div>
<h2>The universal 15-hour entitlement</h2>
<p>Every child aged 3 or 4 in England is entitled to <strong>15 hours of free early education per week</strong> for 38 weeks per year — regardless of whether their parents work. This is called the <strong>universal entitlement</strong> and there are no income requirements. You simply register with an Ofsted-registered provider.</p>
<h2>The working parents 30-hour entitlement</h2>
<p>Working parents who meet the income criteria can access an additional 15 hours — <strong>30 hours in total</strong>. The extra 15 hours is called the <strong>extended entitlement</strong>. To access it, both parents must be working and meet the minimum and maximum income thresholds.</p>
<div class="highlight-box"><p><strong>Think of it this way:</strong> The first 15 hours is a universal right for your child. The second 15 hours is an employment benefit for working parents. You need to apply for the second 15 hours via HMRC — the first 15 hours you just register directly with a provider.</p></div>
<h2>How to get the 15-hour universal entitlement</h2>
<p>Contact any Ofsted-registered nursery, childminder, or pre-school and tell them your child is 3 or 4. They will arrange the funded hours directly with your local authority. You don't need to apply through HMRC.</p>
<h2>How to get the 30-hour extended entitlement</h2>
<p>Apply through the HMRC Childcare Service at gov.uk/tax-free-childcare. You'll receive a 30-hour code to give to your provider. You must reconfirm eligibility every 3 months.</p>
<h2>The new expanded entitlement from September 2024</h2>
<p>From September 2024, working parents of children aged 9 months to 2 years are entitled to 15 free hours per week. This will increase to 30 hours per week for eligible children aged 9 months to school age from September 2025.</p>
""",
[("Do all children get 15 hours free childcare?","Yes — all 3 and 4 year olds in England get 15 hours per week of free early education for 38 weeks per year, regardless of parental income or employment."),
("Can I get 30 hours if only one parent works?","In a two-parent household, both parents must be working. If only one parent works, you only qualify for the universal 15-hour entitlement."),
("Is the 30-hour entitlement really free?","The funded hours are free, but some providers charge for meals, consumables, or additional services. Always check with your provider what is included.")],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("childcare-term-dates","Dates","Term Dates 2025"),("guide","Guide","Tax-Free Childcare Guide")]
)

# PAGE 13: Reconfirming TFC
page("reconfirm-tax-free-childcare",
"How to Reconfirm Tax-Free Childcare Every 3 Months | freechildcarehours.co.uk",
"You must reconfirm your Tax-Free Childcare eligibility every 3 months. Here's how to do it, what happens if you miss it, and how to set up reminders.",
"reconfirm-tax-free-childcare","Reconfirmation","How to Reconfirm Tax-Free Childcare Every 3 Months",
"One of the most common mistakes parents make is forgetting to reconfirm their Tax-Free Childcare eligibility. Here's exactly how the 3-month reconfirmation works, what happens if you miss it, and how to make sure you never do.",
"""
<div class="warn-box"><p><strong>Don't miss this:</strong> If you miss the 3-month reconfirmation window, your Tax-Free Childcare account is suspended and your 30-hour code stops working. Childcare providers cannot claim the funded hours with a lapsed code.</p></div>
<h2>Why reconfirmation is required</h2>
<p>HMRC requires you to reconfirm your eligibility every 3 months because your circumstances may change — you might change jobs, your income might change, or your child might reach an age where they're no longer eligible. The quarterly check keeps the system accurate.</p>
<h2>How to reconfirm</h2>
<ol class="steps">
  <li><div><strong>Watch for the HMRC email reminder</strong><br>HMRC sends an email to your registered address approximately 4 weeks before your reconfirmation is due. Make sure your email address on your Government Gateway account is current.</div></li>
  <li><div><strong>Log in to the Childcare Service</strong><br>Go to gov.uk/tax-free-childcare and sign in with your Government Gateway credentials.</div></li>
  <li><div><strong>Confirm your details</strong><br>HMRC will ask you to confirm that your circumstances haven't changed — you're still working, your income is still within limits, and your child still qualifies. This takes about 2 minutes.</div></li>
  <li><div><strong>Receive confirmation</strong><br>HMRC will confirm immediately that your account remains active and your 30-hour code is still valid.</div></li>
</ol>
<h2>What happens if you miss the deadline</h2>
<p>If you don't reconfirm within the window, your account is <strong>suspended</strong>. You can reactivate it by logging in and completing the reconfirmation — but there may be a gap during which your childcare provider cannot claim your funded hours.</p>
<p>You won't lose any money already in your Tax-Free Childcare account, but you won't be able to top it up or receive government top-ups while suspended.</p>
<h2>Setting up reminders</h2>
<p>The simplest approach is to set a recurring reminder on your phone every 3 months. Note the date your account was approved — your reconfirmation window will fall at roughly the same point every quarter.</p>
<div class="info-box"><p><strong>Tip:</strong> Add a calendar event titled "Reconfirm childcare" on the date you expect the email, with a backup reminder 2 weeks later. Two minutes of effort every 3 months keeps thousands of pounds of childcare funding flowing.</p></div>
""",
[("How often do I need to reconfirm Tax-Free Childcare?","Every 3 months. HMRC will send you an email reminder, but it's worth setting your own calendar reminder as a backup."),
("What happens if I miss the reconfirmation?","Your account is suspended. You can reactivate it by logging in and reconfirming, but there may be a short gap in your funded hours."),
("Does my 30-hour code expire if I miss reconfirmation?","Yes — your 30-hour code becomes invalid when your account is suspended. Your childcare provider cannot claim the funded hours until the code is reactivated.")],
[("how-to-apply-tax-free-childcare","How-to","How to Apply"),("guide","Guide","Tax-Free Childcare Guide"),("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility")]
)

# PAGE 14: TFC for nannies
page("tax-free-childcare-nannies",
"Can You Use Tax-Free Childcare to Pay a Nanny? | freechildcarehours.co.uk",
"Tax-Free Childcare can be used to pay a nanny — but only if they are registered with a nanny agency that is Ofsted registered. Here's how it works.",
"tax-free-childcare-nannies","Nannies","Can You Use Tax-Free Childcare to Pay a Nanny?",
"Tax-Free Childcare can be used for nanny costs — but there's an important condition. The nanny must be registered through an Ofsted-registered nanny agency. Here's what you need to know.",
"""
<h2>The basic rule</h2>
<p>You can use Tax-Free Childcare to pay a nanny, but only if the nanny is <strong>registered with an Ofsted-registered childcare agency</strong>. An individual nanny cannot register directly with Ofsted — they must join a registered agency that handles the Ofsted registration on their behalf.</p>
<h2>How nanny registration works</h2>
<p>Nanny agencies that are Ofsted registered provide their members with an Ofsted registration number. When you pay your nanny through your Tax-Free Childcare account, you enter this registration number to make the payment. The nanny receives the full amount including the government top-up.</p>
<div class="highlight-box"><p><strong>For nanny employers:</strong> If your nanny isn't currently registered, ask them to join an Ofsted-registered nanny agency. The registration process typically costs the nanny around £100–£200 per year but unlocks significant financial benefits for their employers — potentially £2,000/year in government top-ups per family.</p></div>
<h2>Can I use Tax-Free Childcare for a nanny share?</h2>
<p>Yes — if multiple families share a nanny, each family can use their own Tax-Free Childcare account to pay their share, provided the nanny is registered. Each family can receive up to £2,000/year in government top-ups independently.</p>
<h2>The 30-hour entitlement and nannies</h2>
<p>The 30-hour free childcare entitlement cannot currently be used to pay an individual nanny directly — the funded hours must be delivered by a nursery, pre-school, or registered childminder. However, Tax-Free Childcare (with the 20% top-up) can be used for nanny costs without restriction on hours.</p>
<div class="warn-box"><p><strong>Check registration before paying:</strong> Before making payments from your Tax-Free Childcare account, confirm your nanny's Ofsted registration number is valid. HMRC will reject payments to unregistered providers.</p></div>
""",
[("Can I pay a nanny with Tax-Free Childcare?","Yes — provided the nanny is registered through an Ofsted-registered nanny agency. An individual nanny cannot receive TFC payments without agency registration."),
("Can a nanny register directly with Ofsted?","Individual nannies cannot register directly with Ofsted. They need to join an Ofsted-registered childcare agency to be eligible to receive Tax-Free Childcare payments."),
("Can I use 30-hour free childcare for a nanny?","No — the 30-hour entitlement cannot be used to pay individual nannies. Only nurseries, pre-schools, and registered childminders can claim the funded hours.")],
[("guide","Guide","Tax-Free Childcare Guide"),("how-to-apply-tax-free-childcare","How-to","How to Apply"),("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility")]
)

# PAGE 15: Free childcare for 2 year olds
page("free-childcare-2-year-olds",
"Free Childcare for 2 Year Olds: Who Qualifies in 2024/25? | freechildcarehours.co.uk",
"Working parents of 2-year-olds can now get 15 hours free childcare per week. Find out who qualifies, when it starts, and how to apply.",
"free-childcare-2-year-olds","Two Year Olds","Free Childcare for 2 Year Olds: What Working Parents Are Entitled To",
"From April 2024, working parents of 2-year-olds became entitled to 15 hours of free childcare per week. Here's who qualifies, when eligibility starts, and how to claim.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Free hours per week</div><div class="stat-value">15</div><div class="stat-sub">For eligible 2-year-olds</div></div>
  <div class="stat-card"><div class="stat-label">Available from</div><div class="stat-value">Apr 2024</div><div class="stat-sub">For working parents</div></div>
  <div class="stat-card"><div class="stat-label">Annual hours</div><div class="stat-value">570</div><div class="stat-sub">Over 38 term weeks</div></div>
</div>
<h2>The expansion of free childcare</h2>
<p>From April 2024, the government extended free childcare to 2-year-olds of working parents as part of a major expansion of the scheme. This is separate from the existing entitlement for disadvantaged 2-year-olds that has existed for many years.</p>
<h2>Who qualifies?</h2>
<p>To access 15 hours free childcare for a 2-year-old, the same working parents eligibility criteria apply as for 3 and 4 year olds:</p>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>Both parents are working</strong> (or sole parent in a single-parent household)</div></li>
  <li><span class="tick">✓</span><div><strong>Each parent earns at least £9,518/year</strong></div></li>
  <li><span class="tick">✓</span><div><strong>Neither parent earns over £100,000 adjusted net income</strong></div></li>
  <li><span class="tick">✓</span><div><strong>Child is aged 2 years old</strong></div></li>
</ul>
<h2>When does eligibility start?</h2>
<p>The same term-date rules apply. Your child becomes eligible from the term following their second birthday. The three term start dates are 1 January, 1 April, and 1 September.</p>
<div class="highlight-box"><p><strong>Example:</strong> Your child turns 2 on 20 June 2025. The term following their birthday starts on 1 September 2025. They become eligible for 15 free hours from 1 September 2025.</p></div>
<h2>The roadmap to 30 hours</h2>
<p>The government's plan is to expand free childcare further:</p>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>April 2024:</strong> 15 hours for eligible 2-year-olds</div></li>
  <li><span class="tick">✓</span><div><strong>September 2024:</strong> 15 hours for children aged 9 months to 2 years</div></li>
  <li><span class="tick">✓</span><div><strong>September 2025:</strong> 30 hours for eligible children aged 9 months to school age</div></li>
</ul>
<div class="info-box"><p><strong>Note:</strong> The September 2025 expansion to 30 hours for under-3s was subject to government confirmation. Check gov.uk for the latest updates on this expansion.</p></div>
""",
[("Can I get free childcare for a 2-year-old if I work part-time?","Yes — as long as your part-time earnings meet the minimum threshold of £9,518/year, you qualify."),
("Is there a non-working 2-year-old entitlement?","Yes — children from lower income families or in certain circumstances (e.g. in care, with a parent receiving certain benefits) may qualify for 15 hours free childcare regardless of parental employment."),
("Does the same £100,000 income limit apply for 2-year-olds?","Yes — the same income rules apply. Neither parent can have an adjusted net income above £100,000.")],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("childcare-term-dates","Dates","Term Dates 2025"),("free-childcare-maternity-leave","Maternity","Childcare on Maternity Leave")]
)

# PAGE 16: Universal Credit and childcare
page("universal-credit-childcare",
"Universal Credit and Free Childcare: What Are You Entitled To? | freechildcarehours.co.uk",
"If you receive Universal Credit, you may be able to claim up to 85% of childcare costs. Here's how UC childcare support works alongside 30-hour free childcare and Tax-Free Childcare.",
"universal-credit-childcare","Universal Credit","Universal Credit and Childcare: What Working Parents Can Claim",
"Universal Credit offers up to 85% back on childcare costs for eligible working parents. But it interacts in important ways with Tax-Free Childcare and the 30-hour entitlement. Here's how to navigate it.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">UC childcare support</div><div class="stat-value">Up to 85%</div><div class="stat-sub">Of eligible costs</div></div>
  <div class="stat-card"><div class="stat-label">Monthly cap (1 child)</div><div class="stat-value">£1,014</div><div class="stat-sub">Of childcare costs</div></div>
  <div class="stat-card"><div class="stat-label">Monthly cap (2+ children)</div><div class="stat-value">£1,739</div><div class="stat-sub">Of childcare costs</div></div>
</div>
<h2>How Universal Credit childcare support works</h2>
<p>If you're in work and receiving Universal Credit, you can claim back up to <strong>85% of eligible registered childcare costs</strong> through the UC childcare element. There are monthly caps on the costs you can claim — £1,014.63 per month for one child and £1,739.37 for two or more children.</p>
<h2>Can you use UC childcare support and Tax-Free Childcare together?</h2>
<p><strong>No</strong> — you cannot claim Universal Credit childcare support and Tax-Free Childcare top-ups for the same childcare costs. You must choose one or the other for any given period of childcare.</p>
<div class="highlight-box"><p><strong>Which is better?</strong> If UC covers 85% of your costs, it's almost certainly worth more than the 20% Tax-Free Childcare top-up. However, if your childcare costs are high (near the UC cap), or if you have multiple children, the calculation becomes more complex. Our calculator can help you compare.</p></div>
<h2>Can you use 30-hour free childcare with Universal Credit?</h2>
<p>Yes — the 30-hour entitlement works alongside Universal Credit. You use your 30-hour code for the free hours, and UC childcare support (or Tax-Free Childcare, whichever you choose) for any additional costs such as extra hours, meals, or holiday care.</p>
<h2>The childcare cost timing issue with UC</h2>
<p>Universal Credit childcare costs are reimbursed in <strong>arrears</strong> — you must pay upfront and then claim back. This can create cash flow difficulties. Some local councils offer childcare cost advances to help bridge this gap.</p>
<div class="warn-box"><p><strong>Keep all receipts:</strong> UC requires evidence of childcare payments. Keep receipts or bank statements showing every childcare payment you're claiming for.</p></div>
""",
[("Can I get 30-hour free childcare if I'm on Universal Credit?","Yes — the 30-hour entitlement and Universal Credit childcare support are separate schemes that work alongside each other. You can receive both."),
("Is Tax-Free Childcare or Universal Credit better?","For most UC claimants, the 85% UC childcare element is worth more than the 20% TFC top-up. But it depends on your income, childcare costs, and UC calculation."),
("Can I switch between UC childcare and Tax-Free Childcare?","You can switch, but it's complex and there may be a gap in support. Seek advice from Citizens Advice or a benefits adviser before switching.")],
[("guide","Guide","Tax-Free Childcare Complete Guide"),("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility"),("free-childcare-single-parents","Single Parents","Free Childcare for Single Parents")]
)

# PAGE 17: What TFC can be used for
page("what-can-tax-free-childcare-be-used-for",
"What Can Tax-Free Childcare Be Used For? | freechildcarehours.co.uk",
"Tax-Free Childcare can pay for nurseries, childminders, after-school clubs, holiday camps, and registered nannies. Here's the full list of eligible costs.",
"what-can-tax-free-childcare-be-used-for","TFC Costs","What Can You Use Tax-Free Childcare For?",
"Tax-Free Childcare can be used for a wide range of registered childcare costs — not just nurseries. Here's the complete list of what qualifies and what doesn't.",
"""
<h2>What Tax-Free Childcare covers</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>Nurseries and day nurseries</strong> — Ofsted-registered nurseries are the most common use</div></li>
  <li><span class="tick">✓</span><div><strong>Registered childminders</strong> — childminders registered with Ofsted or a childminder agency</div></li>
  <li><span class="tick">✓</span><div><strong>Pre-schools and playgroups</strong> — Ofsted-registered settings</div></li>
  <li><span class="tick">✓</span><div><strong>After-school clubs</strong> — Ofsted-registered after-school care</div></li>
  <li><span class="tick">✓</span><div><strong>Breakfast clubs</strong> — Ofsted-registered providers</div></li>
  <li><span class="tick">✓</span><div><strong>Holiday clubs and camps</strong> — Ofsted-registered holiday childcare providers</div></li>
  <li><span class="tick">✓</span><div><strong>Registered nannies</strong> — nannies registered through an Ofsted-registered nanny agency</div></li>
</ul>
<h2>What Tax-Free Childcare does NOT cover</h2>
<ul class="check-list">
  <li><span class="cross">✕</span><div><strong>School fees or school meals</strong> — state or private school tuition is not eligible</div></li>
  <li><span class="cross">✕</span><div><strong>Unregistered babysitters or au pairs</strong> — must be Ofsted registered</div></li>
  <li><span class="cross">✕</span><div><strong>School trips or uniforms</strong> — not childcare costs</div></li>
  <li><span class="cross">✕</span><div><strong>Tutoring or extracurricular activities</strong> — unless delivered by a registered childcare provider</div></li>
  <li><span class="cross">✕</span><div><strong>Parent and toddler groups</strong> — unless the setting is Ofsted registered as a childcare provider</div></li>
</ul>
<div class="highlight-box"><p><strong>The key test:</strong> The provider must be registered with Ofsted (or the equivalent regulator in Scotland, Wales, or Northern Ireland) as a childcare provider. If in doubt, ask your provider for their Ofsted registration number before making a payment.</p></div>
<h2>Holiday clubs — a hidden opportunity</h2>
<p>Many parents don't realise that <strong>holiday clubs and activity camps</strong> qualify for Tax-Free Childcare, provided they are Ofsted registered. This makes the summer holidays significantly cheaper. Always check the provider is registered before booking — many are, and will advertise this.</p>
<h2>How to pay a provider</h2>
<p>Log into your Tax-Free Childcare account, enter your provider's Ofsted registration number, and make the payment directly. The payment leaves your account (including government top-up) and arrives with the provider within 3–5 working days.</p>
""",
[("Can I use Tax-Free Childcare for after-school clubs?","Yes — Ofsted-registered after-school clubs and breakfast clubs are eligible for Tax-Free Childcare payments."),
("Does Tax-Free Childcare cover holiday camps?","Yes — Ofsted-registered holiday clubs and activity camps qualify. Always check the provider's registration before booking."),
("Can I use Tax-Free Childcare for private school fees?","No — school fees are not eligible. Tax-Free Childcare can only be used for registered childcare costs, not education fees.")],
[("guide","Guide","Tax-Free Childcare Complete Guide"),("tax-free-childcare-nannies","Nannies","TFC for Nannies"),("how-to-apply-tax-free-childcare","How-to","How to Apply")]
)

# PAGE 18: Free childcare Scotland
page("free-childcare-scotland",
"Free Childcare in Scotland: How It Differs from England | freechildcarehours.co.uk",
"Scotland has its own free childcare scheme with different rules, hours, and eligibility criteria from England. Here's what Scottish parents need to know.",
"free-childcare-scotland","Scotland","Free Childcare in Scotland: What Parents Need to Know",
"Free childcare in Scotland is more generous than in England in some respects — but the rules and application process are different. Here's a guide for Scottish parents.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Free hours per week</div><div class="stat-value">30</div><div class="stat-sub">For eligible 3-4 year olds</div></div>
  <div class="stat-card"><div class="stat-label">Annual hours</div><div class="stat-value">1,140</div><div class="stat-sub">Per year</div></div>
  <div class="stat-card"><div class="stat-label">Administered by</div><div class="stat-value">Local authority</div><div class="stat-sub">Not HMRC</div></div>
</div>
<h2>Scotland's Early Learning and Childcare (ELC) scheme</h2>
<p>Scotland's free childcare scheme is called <strong>Early Learning and Childcare (ELC)</strong> and is administered by Scottish local authorities — not HMRC. All 3 and 4 year olds are entitled to <strong>1,140 hours per year</strong>, which works out to approximately 30 hours per week during term time or 22 hours per week if spread across the full year.</p>
<h2>Key differences from England</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>The 1,140 hours applies to all 3-4 year olds</strong> — not just working parents. Scotland doesn't have a separate 15/30 hour split based on employment status in the same way England does.</div></li>
  <li><span class="tick">✓</span><div><strong>Applied for through your local council</strong> — not through HMRC</div></li>
  <li><span class="tick">✓</span><div><strong>Available across 52 weeks</strong> — many councils offer the option to spread hours across the full year rather than just term time</div></li>
  <li><span class="tick">✓</span><div><strong>Some eligible 2-year-olds also qualify</strong> — families in certain circumstances can access ELC from age 2</div></li>
</ul>
<h2>Tax-Free Childcare in Scotland</h2>
<p>Tax-Free Childcare is available in Scotland on the same terms as England — it's a UK-wide scheme run by HMRC. Scottish parents can use Tax-Free Childcare for costs beyond the free 1,140 hours, with the same 20% government top-up and £2,000/year maximum.</p>
<h2>How to apply for ELC in Scotland</h2>
<p>Contact your local council's education department or check their website. Each council manages ELC placements in their area and will direct you to registered providers. You don't need a Government Gateway account for the ELC entitlement itself.</p>
<div class="info-box"><p><strong>Also eligible for Tax-Free Childcare:</strong> Even though Scotland's free hours are more generous, Scottish parents can still apply for Tax-Free Childcare through HMRC for any additional childcare costs beyond the 1,140 free hours.</p></div>
""",
[("Do Scotland's free childcare rules differ from England?","Yes — Scotland has its own Early Learning and Childcare (ELC) scheme offering 1,140 hours per year to all 3 and 4 year olds, regardless of parental employment. It's administered by local councils, not HMRC."),
("Can Scottish parents use Tax-Free Childcare?","Yes — Tax-Free Childcare is a UK-wide scheme available in Scotland. Scottish parents can use it for childcare costs beyond their 1,140 free ELC hours."),
("How do I apply for free childcare in Scotland?","Contact your local council's education department. Each Scottish council manages ELC placements locally.")],
[("guide","Guide","Tax-Free Childcare Guide"),("30-hour-free-childcare-eligibility","Eligibility","England 30-Hour Guide"),("how-to-apply-tax-free-childcare","How-to","How to Apply for TFC")]
)

# PAGE 19: Free childcare Wales
page("free-childcare-wales",
"Free Childcare in Wales: Flying Start and Childcare Offer Explained | freechildcarehours.co.uk",
"Wales has its own childcare schemes including the Childcare Offer Wales and Flying Start. Here's what Welsh parents are entitled to and how to apply.",
"free-childcare-wales","Wales","Free Childcare in Wales: The Childcare Offer and Flying Start Explained",
"Wales has its own childcare support schemes — the Childcare Offer for Wales and Flying Start — with different rules from England. Here's what Welsh working parents need to know.",
"""
<div class="stat-grid">
  <div class="stat-card"><div class="stat-label">Childcare Offer</div><div class="stat-value">30 hrs</div><div class="stat-sub">Per week for working parents</div></div>
  <div class="stat-card"><div class="stat-label">School weeks</div><div class="stat-value">48</div><div class="stat-sub">More generous than England</div></div>
  <div class="stat-card"><div class="stat-label">Available from</div><div class="stat-value">Age 3</div><div class="stat-sub">To school age</div></div>
</div>
<h2>The Childcare Offer for Wales</h2>
<p>The Childcare Offer for Wales provides <strong>30 hours per week of free childcare and early education</strong> for eligible working parents of 3 and 4 year olds — for up to <strong>48 weeks per year</strong>. This is more generous than England's 38-week term-time entitlement.</p>
<h2>Eligibility for the Childcare Offer</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>Child aged 3 or 4</strong> (up to school age)</div></li>
  <li><span class="tick">✓</span><div><strong>Both parents working</strong> (or sole parent in single-parent household)</div></li>
  <li><span class="tick">✓</span><div><strong>Each parent earning at least £9,518/year</strong></div></li>
  <li><span class="tick">✓</span><div><strong>Neither parent earning over £100,000 adjusted net income</strong></div></li>
  <li><span class="tick">✓</span><div><strong>Living in Wales</strong></div></li>
</ul>
<h2>Flying Start</h2>
<p>Flying Start is a Welsh Government programme for children aged 0–4 in targeted areas, offering 12.5 hours per week of free quality childcare for 2-year-olds. Eligibility is based on where you live (in a Flying Start area) rather than parental income or employment.</p>
<h2>How to apply</h2>
<p>Apply for the Childcare Offer through <strong>Childcare Wales</strong> (gov.wales/childcare-offer-for-wales). You'll need to create an account and verify your eligibility. The system is separate from HMRC's childcare service used in England.</p>
<h2>Tax-Free Childcare in Wales</h2>
<p>Tax-Free Childcare is available in Wales on the same terms as the rest of the UK. Welsh parents can use it for childcare costs not covered by the Childcare Offer — including wraparound care, additional hours, and holiday childcare.</p>
<div class="info-box"><p><strong>48 weeks vs 38 weeks:</strong> The Childcare Offer for Wales covers 48 weeks — 10 more than England's entitlement. This makes it significantly more valuable for Welsh working parents.</p></div>
""",
[("How many hours of free childcare do Welsh parents get?","The Childcare Offer for Wales provides 30 hours per week for up to 48 weeks per year for eligible working parents of 3-4 year olds."),
("Is the Childcare Offer the same as England's 30 hours?","Similar eligibility rules, but more generous — 48 weeks per year versus 38 in England, and administered separately through Childcare Wales rather than HMRC."),
("Can I use Tax-Free Childcare in Wales?","Yes — Tax-Free Childcare is UK-wide and available to Welsh parents for costs beyond the Childcare Offer entitlement.")],
[("guide","Guide","Tax-Free Childcare Guide"),("30-hour-free-childcare-eligibility","Eligibility","England 30-Hour Guide"),("free-childcare-scotland","Scotland","Free Childcare in Scotland")]
)

# PAGE 20: Childcare cost calculator explainer
page("childcare-cost-calculator",
"Free Childcare Cost Calculator: How Much Will You Save? | freechildcarehours.co.uk",
"Calculate exactly how much you'll save with 30-hour free childcare and Tax-Free Childcare. See your annual saving, monthly household income, and salary sacrifice impact.",
"childcare-cost-calculator","Calculator","How Much Will You Save? Use Our Free Childcare Cost Calculator",
"Our free childcare calculator shows you exactly how much 30-hour childcare and Tax-Free Childcare will save your family — including the impact of salary sacrifice on your eligibility and take-home pay.",
"""
<h2>What our calculator shows you</h2>
<ul class="check-list">
  <li><span class="tick">✓</span><div><strong>Your eligibility</strong> — whether you qualify for 30-hour free childcare and Tax-Free Childcare based on your incomes</div></li>
  <li><span class="tick">✓</span><div><strong>Annual saving from free hours</strong> — based on your local nursery rate or the UK average</div></li>
  <li><span class="tick">✓</span><div><strong>Tax-Free Childcare top-up</strong> — the government's 20% contribution on additional costs</div></li>
  <li><span class="tick">✓</span><div><strong>Full household take-home pay</strong> — including income tax, National Insurance, and student loan deductions</div></li>
  <li><span class="tick">✓</span><div><strong>Salary sacrifice impact</strong> — how pension, cycle to work, and EV schemes affect your eligibility and take-home pay</div></li>
  <li><span class="tick">✓</span><div><strong>Countdown to eligibility</strong> — how many days until your child qualifies, based on their date of birth</div></li>
</ul>
<h2>How to use the calculator</h2>
<ol class="steps">
  <li><div><strong>Enter your child's date of birth</strong><br>In the Settings tab. The calculator shows your personalised countdown to eligibility.</div></li>
  <li><div><strong>Enter your salary details</strong><br>In the Income &amp; Tax tab. Choose Simple mode for a single annual figure, or Advanced mode to enter monthly amounts.</div></li>
  <li><div><strong>Add salary sacrifice schemes</strong><br>Toggle on pension, cycle to work, or EV schemes to see how they affect your eligibility and take-home pay.</div></li>
  <li><div><strong>Enter your nursery rate</strong><br>In the Better Off tab. Enter your local hourly rate or use the UK average to see your annual saving.</div></li>
</ol>
<h2>How the savings are calculated</h2>
<p>The calculator uses the following methodology:</p>
<div class="highlight-box"><p><strong>Annual saving = Free hours per week × 38 term weeks × Your hourly nursery rate</strong><br><br>Plus Tax-Free Childcare top-up of up to £2,000 per year per child on additional costs.</p></div>
<h2>The salary sacrifice calculation</h2>
<p>For pension salary sacrifice, the calculator uses 2024/25 income tax rates and National Insurance rates to show the exact saving. For EV car schemes, it applies the current BIK rate (2% for pure EVs) to calculate the net benefit after BIK tax. This gives you a realistic picture of the true cost or saving of each scheme.</p>
<div class="info-box"><p><strong>Note on accuracy:</strong> The calculator provides estimates based on standard PAYE income. It does not account for complex tax situations such as rental income, investment income, or complex Self Assessment scenarios. Always verify with HMRC or a qualified accountant for your specific situation.</p></div>
""",
[("How accurate is the childcare calculator?","The calculator uses 2024/25 UK tax rates and HMRC rules to provide accurate estimates for standard PAYE employees. Results may vary for those with complex tax situations."),
("Does the calculator work for self-employed parents?","The income and eligibility checks work for self-employed parents, but the take-home pay calculation is designed for PAYE. Self-employed parents should use their net profit figure."),
("Is the calculator free to use?","Yes — completely free, with no sign-up required. Your data is stored only on your own device.")],
[("30-hour-free-childcare-eligibility","Eligibility","30-Hour Eligibility Guide"),("guide","Guide","Tax-Free Childcare Complete Guide"),("how-to-apply-tax-free-childcare","How-to","How to Apply")]
)

print("\n✓ All 10 additional pages built!")
