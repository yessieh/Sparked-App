// Sparked landings — shared FAQ accordion.
// Single source of content + behavior for every /landing funnel variant.
// Usage on any page: include the shared stylesheet (../_shared.css already
// loaded), add one mount point, and load this script:
//   <div data-faq-mount></div>
//   <script src="../faq.js" defer></script>
// It replaces the mount div with a fully-built <section class="faq-section">
// (title + accordion), so content/behavior only ever lives here.
(function () {
  var FAQ_ITEMS = [
    { q: 'What does it cost to post?',
      a: 'Community member Curbside posts are free — 3 every 100 days. Standard events are $5 (single-day), $12 (2–4 days), or $20 (5+ days). Plus events are $15 / $29 / $49 and add a 10-photo gallery, paid-entry display, and a site map with vendor pins.' },
    { q: "What's the difference between a Curbside post and an Event?",
      a: 'Curbside posts are for casual community posts — yard sales, free pickup items, block celebrations. One photo, a description, an address, one day. Events are full listings for businesses and organizers: categories, schedules, venues, photo galleries.' },
    { q: 'Is this a subscription?',
      a: "No. You pay once per event. That's it." },
    { q: 'Do you sell tickets?',
      a: 'No — Sparked is where people find your event. You can display your entry fee, but admission is handled by you at the door or through your own ticketing.' },
    { q: 'How does the feed decide what to show?',
      a: "Distance. Events near you show first — no algorithm, no paid placement. You can't buy a higher spot in the feed, and neither can anyone else." },
    { q: 'What if I cancel my event?',
      a: 'Cancel 72+ hours before your event: full refund. Less than 72 hours: 50%. Same-day: no refund. Attendees see your event marked as cancelled.' },
    { q: 'Do attendees pay anything?',
      a: 'No. Browsing, bookmarking, and RSVPing are free — no account needed to browse.' },
    { q: 'What do you do with my data?',
      a: 'As little as possible. Location is used live to rank your feed and never stored. Analytics are off by default. You can download or delete everything in Settings → Privacy.' },
    { q: 'Can my team manage our events?',
      a: 'Teams and roles are coming. Today each workspace has one owner, and business handoff is supported.' },
    { q: 'How do I report a problem event?',
      a: 'Every event has a Report option — flagged events are reviewed and removed if they break the rules.' },
  ];

  function renderFAQ(mount) {
    var section = document.createElement('section');
    section.className = 'faq-section';
    section.setAttribute('aria-labelledby', 'faq-h');

    var shell = document.createElement('div');
    shell.className = 'shell';

    var title = document.createElement('h2');
    title.className = 'faq-title';
    title.id = 'faq-h';
    title.textContent = 'Questions? We have answers.';
    shell.appendChild(title);

    var list = document.createElement('div');
    list.className = 'faq-list';

    FAQ_ITEMS.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'faq-item';

      var qId = 'faq-q-' + i, aId = 'faq-a-' + i;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'faq-q';
      btn.id = qId;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', aId);
      btn.innerHTML = '<span>' + item.q + '</span>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

      var aWrap = document.createElement('div');
      aWrap.className = 'faq-a-wrap';
      var aInner = document.createElement('div');
      aInner.className = 'faq-a-inner';
      var aP = document.createElement('p');
      aP.className = 'faq-a';
      aP.id = aId;
      aP.setAttribute('role', 'region');
      aP.setAttribute('aria-labelledby', qId);
      aP.textContent = item.a;
      aInner.appendChild(aP);
      aWrap.appendChild(aInner);

      btn.addEventListener('click', function () {
        var willOpen = !row.classList.contains('open');
        list.querySelectorAll('.faq-item.open').forEach(function (openRow) {
          openRow.classList.remove('open');
          openRow.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          row.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      row.appendChild(btn);
      row.appendChild(aWrap);
      list.appendChild(row);
    });

    shell.appendChild(list);
    section.appendChild(shell);
    mount.replaceWith(section);
  }

  function init() {
    document.querySelectorAll('[data-faq-mount]').forEach(renderFAQ);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
