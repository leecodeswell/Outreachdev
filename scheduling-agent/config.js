/* Firebase connection for Scheduling Agent.
   These values identify your project. They are safe to publish: access is
   controlled by the security rules in firestore.rules, not by hiding this. */
window.SA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrNntYfI0r1X809afCqAhgTVa02jp5QFA",
  authDomain: "outreachdev-scheduling-eb94c.firebaseapp.com",
  projectId: "outreachdev-scheduling-eb94c",
  storageBucket: "outreachdev-scheduling-eb94c.firebasestorage.app",
  messagingSenderId: "185463350531",
  appId: "1:185463350531:web:df319ebc97084ec7be3536"
};

/* Plans and prices shown in the app. Change them here any time.
   url: the checkout link from Lemon Squeezy for that product (leave null until you have it).
   If you change trialDays, change the "14" in firestore.rules too. */
window.SA_BILLING = {
  trialDays: 14,
  contact: "thompsontechnologiesleet@gmail.com",
  plans: [
    { id: "lifetime", label: "Pay once", price: "$60", per: "one time", note: "Use it for as long as you like. Updates to version 1 included.", url: null },
    { id: "monthly", label: "Monthly", price: "$12", per: "per month", note: "Cancel any time.", url: null }
  ]
};
