/**
 * MMHSG: central config
 * ---------------------------------------------------------
 * Change the join link and add events here.
 * Page copy lives in the HTML files.
 *
 * Everything is attached to window.SITE_CONTENT so site.js can read it.
 * (A top-level `const` in a classic script is NOT visible on window,
 * which is why the old version never wired up the Join buttons.)
 */
window.SITE_CONTENT = {
  brand: {
    name: 'Manipal Mental Health Support Group',
    abbr: 'MMHSG',
    email: 'manipalmentalhealthsupport@s194d.me',
    instagramUrl: 'https://instagram.com/mhsg_manipal',

    // Every "Join" button on the site points here.
    // If you later switch to a direct WhatsApp invite, change only this line.
    JOIN_FORM_URL:
      'https://docs.google.com/forms/d/e/1FAIpQLScCNL6OscARcejL2sSW-4p-Ksa7k8xjtayyUoLXqQnfUBkwiw/viewform?usp=dialog',
  },

  // An empty array shows the "Nothing scheduled yet" state.
  // Shape: { id, title, startsAt (ISO 8601, +05:30), location, isOnline,
  //          category, description, link? }
  events: [
    // {
    //   id: 'example-001',
    //   title: 'Community meetup',
    //   startsAt: '2026-11-15T17:00:00+05:30',
    //   location: 'Manipal',
    //   isOnline: false,
    //   category: 'meetup', // meetup | discussion | activity | other
    //   description: 'A casual meetup to connect with other members.',
    //   link: 'https://example.com',
    // },
  ],
};
