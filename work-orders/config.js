/* Firebase connection for Work Order Manager.
   Same Firebase project as Scheduling Agent; the two apps keep their data apart
   (this one uses the wo_ collections). These values identify the project and are
   safe to publish: access is controlled by the security rules, not by hiding this.

   Set WO_FIREBASE_CONFIG = null to run in "this browser only" mode (for demos). */
window.WO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrNntYfI0r1X809afCqAhgTVa02jp5QFA",
  authDomain: "outreachdev-scheduling-eb94c.firebaseapp.com",
  projectId: "outreachdev-scheduling-eb94c",
  storageBucket: "outreachdev-scheduling-eb94c.firebasestorage.app",
  messagingSenderId: "185463350531",
  appId: "1:185463350531:web:df319ebc97084ec7be3536"
};

/* Plans and prices shown in the app. Change them here any time.
   url: the checkout link from Lemon Squeezy for that product (null until you have it).
   If you change trialDays, change the "14" in firestore.rules too. */
window.WO_BILLING = {
  trialDays: 14,
  contact: "thompsontechnologiesleet@gmail.com",
  plans: [
    { id: "lifetime", label: "Pay once", price: "$60", per: "one time", note: "Unlimited team members. Updates to version 1 included.", url: null },
    { id: "monthly", label: "Monthly", price: "$12", per: "per month", note: "Unlimited team members. Cancel any time.", url: null }
  ]
};
