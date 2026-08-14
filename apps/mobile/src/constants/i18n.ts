export type Language = "en" | "de";

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // common
  "common.total": "Total",
  "common.subtotal": "Subtotal",
  "common.delivery": "Delivery fee",
  "common.free": "Free",
  "common.freeDelivery": "Free delivery",
  "common.freeDeliveryNote": "Free delivery on every order",
  "splash.tagline": "PREMIUM PIZZA, DELIVERED",
  "settings.version": "YesPiz 3.0 · Version 3.0.0",
  "notFound.title": "Oops!",
  "notFound.message": "This screen doesn't exist.",
  "notFound.goHome": "Go to home screen!",
  "common.discount": "Discount",
  "common.item": "item",
  "common.items": "items",
  "common.browseMenu": "Browse menu",
  "common.logout": "Log Out",
  "common.backToHome": "Back to Home",
  "common.min": "min",

  // partner badge
  "partner.nearYou": "Partner Kitchen Near You",
  "partner.driver": "Partner Driver",

  // nav
  "nav.home": "Home",
  "nav.menu": "Menu",
  "nav.orders": "Orders",
  "nav.profile": "Profile",

  // order steps
  "step.received.label": "Order Received",
  "step.received.hint": "We've got your order",
  "step.kitchen.label": "Partner Kitchen Found",
  "step.kitchen.hint": "Nearest kitchen matched",
  "step.preparing.label": "Preparing",
  "step.preparing.hint": "Fresh dough in the oven",
  "step.driver.label": "Driver Assigned",
  "step.driver.hint": "Partner driver on route to kitchen",
  "step.onway.label": "On The Way",
  "step.onway.hint": "Heading to your address",
  "step.delivered.label": "Delivered",
  "step.delivered.hint": "Enjoy your YesPiz",

  // onboarding
  "onboarding.skip": "Skip",
  "onboarding.continue": "Continue",
  "onboarding.getStarted": "Get Started",
  "onboarding.slide1.title": "Ten pizzas.\nZero compromise.",
  "onboarding.slide1.body":
    "A tightly curated menu of chef-grade pizzas, crafted from a 48-hour fermented base.",
  "onboarding.slide2.title": "Routed to the\nnearest kitchen.",
  "onboarding.slide2.body":
    "We match every order to the closest partner kitchen — so it arrives hot, fast and fresh.",
  "onboarding.slide3.title": "Free delivery,\nevery single time.",
  "onboarding.slide3.body":
    "Live tracking and a partner driver bring your YesPiz straight to you — delivery is always free.",

  // login
  "login.welcome": "Welcome back",
  "login.subtitle": "Sign in to order chef-grade pizza in minutes.",
  "login.apple": "Continue with Apple",
  "login.google": "Continue with Google",
  "login.email": "Continue with Email",
  "login.terms": "By continuing you agree to our Terms & Privacy Policy.",
  "login.tabOtp": "Phone OTP",
  "login.tabPassword": "Email",
  "login.phone": "Phone number",
  "login.phonePlaceholder": "+49 170 0000000",
  "login.code": "OTP code",
  "login.codePlaceholder": "000000",
  "login.sendOtp": "Send code",
  "login.confirmOtp": "Verify & continue",
  "login.otpHint": "Dev bypass code: 000000",
  "login.firstName": "First name",
  "login.lastName": "Last name",
  "login.emailLabel": "Email",
  "login.password": "Password",
  "login.signIn": "Sign in",
  "login.register": "Create account",
  "login.needAccount": "New here? Register",
  "login.haveAccount": "Already have an account? Sign in",
  "login.offlineBanner": "Menu offline — showing saved items",
  "login.errorGeneric": "Could not sign in. Please try again.",
  "payment.processing": "Processing…",
  "payment.error": "Payment failed. Please try again.",
  "payment.needAuth": "Please sign in to place an order.",
  "payment.needAddress": "Select a delivery address first.",
  "settings.addressLabel": "Label",
  "settings.addressStreet": "Street",
  "settings.addressCity": "City",
  "settings.addressZip": "ZIP",
  "settings.saveAddress": "Save address",
  "settings.addressSaved": "Address saved",

  // home
  "home.deliverTo": "Deliver to Home",
  "home.greeting": "Hey {name}",
  "home.search": "Search the menu",
  "home.chefsPick": "Chef's Pick",

  // categories
  "category.All": "All",
  "category.Popular": "Popular",
  "category.Classic": "Classic",
  "category.Spicy": "Spicy",
  "category.Veggie": "Veggie",
  "category.Premium": "Premium",

  // promos
  "promo.welcome.title": "30% OFF",
  "promo.welcome.subtitle": "Your first YesPiz order",
  "promo.welcome.badge": "WELCOME30",
  "promo.free.title": "Free Delivery",
  "promo.free.subtitle": "Always, on every order",
  "promo.free.badge": "ALWAYS FREE",
  "promo.weekend.title": "Weekend Special",
  "promo.weekend.subtitle": "YesPiz Special for €12.90",
  "promo.weekend.badge": "WEEKEND",

  // menu
  "menu.title": "Menu",
  "menu.subtitle": "Ten pizzas, made to order",
  "menu.search": "Search pizzas",
  "sort.Recommended": "Recommended",
  "sort.Top Rated": "Top Rated",
  "sort.Fastest": "Fastest",
  "sort.Price": "Price",

  // pizza detail
  "pizza.freeDelivery": "Free delivery",
  "pizza.ingredients": "Ingredients",
  "pizza.chooseSize": "Choose size",
  "pizza.addExtras": "Add extras",
  "pizza.quantity": "Quantity",
  "pizza.base": "Base",
  "pizza.addToCart": "Add to Cart",
  "pizza.notFound": "Pizza not found",

  // sizes
  "size.small": "Small",
  "size.medium": "Medium",
  "size.large": "Large",

  // extras
  "extra.extra-cheese": "Extra Cheese",
  "extra.jalapenos": "Jalapenos",
  "extra.olives": "Olives",
  "extra.garlic-dip": "Garlic Dip",

  // cart
  "cart.title": "Your Cart",
  "cart.empty": "Your cart is empty",
  "cart.emptyBody": "Add a pizza from the menu to get started.",
  "cart.promoApply": "Apply promo code WELCOME30",
  "cart.promoApplied": "WELCOME30 applied — 30% off",
  "cart.discountLabel": "Discount (30%)",
  "cart.checkout": "Proceed to Checkout",

  // checkout
  "checkout.title": "Checkout",
  "checkout.subtitle": "Confirm delivery details",
  "checkout.address": "Delivery Address",
  "checkout.time": "Delivery Time",
  "checkout.leaveAtDoor": "Leave at the door",
  "checkout.partnerNote":
    "Your order is matched to the nearest partner kitchen for the freshest, fastest delivery.",
  "checkout.continuePayment": "Continue to Payment",
  "time.asap": "ASAP (25–35 min)",
  "time.45": "In 45 min",
  "time.1hour": "In 1 hour",
  "time.later": "Schedule later",

  // payment
  "payment.title": "Payment",
  "payment.subtitle": "Choose how to pay",
  "payment.visa": "Visa",
  "payment.visaDetail": "•••• 4291",
  "payment.apple": "Apple Pay",
  "payment.appleDetail": "Default wallet",
  "payment.cash": "Cash on Delivery",
  "payment.cashDetail": "Pay the partner driver",
  "payment.addCard": "Add a new card",
  "payment.summary": "Order Summary",
  "payment.pay": "Pay {amount}",

  // addresses
  "address.home": "Home",
  "address.work": "Work",

  // tracking
  "tracking.title": "Order Tracking",
  "tracking.noActive": "No active order",
  "tracking.onWayToYou": "On the way to you",
  "tracking.viewOrders": "View Orders",
  "tracking.minSuffix": "{n} min",

  // orders
  "orders.title": "Orders",
  "orders.active": "Active",
  "orders.history": "History",
  "orders.cancelled": "Cancelled",
  "orders.delivered": "Delivered",
  "orders.track": "Track order",
  "orders.reorder": "Reorder",
  "orders.orderNum": "Order #{id}",
  "orders.noActive": "No active orders",
  "orders.noPast": "No past orders",
  "orders.emptyBody": "When you place an order it will show up here.",

  // profile
  "profile.title": "Profile",
  "profile.tierGold": "GOLD",
  "profile.stats.orders": "Orders",
  "profile.stats.favorites": "Favorites",
  "profile.stats.points": "Points",
  "profile.darkMode": "Dark Mode",
  "profile.notifications": "Notifications",
  "profile.addresses": "Delivery Addresses",
  "profile.payment": "Payment Methods",
  "profile.partner": "Partner Dashboard",
  "profile.help": "Help Center",
  "profile.settings": "Settings",

  // notifications
  "notifications.title": "Notifications",
  "notifications.unread": "{n} unread",
  "notifications.caughtUp": "You're all caught up",
  "notifications.markAll": "Mark all",
  "notif.n1.title": "Your YesPiz is on the way",
  "notif.n1.body": "A partner driver is 8 minutes away.",
  "notif.n1.time": "Just now",
  "notif.n2.title": "30% off your next order",
  "notif.n2.body": "Use code WELCOME30 at checkout.",
  "notif.n2.time": "2h ago",
  "notif.n3.title": "Weekend Special is live",
  "notif.n3.body": "Get the YesPiz Special for €12.90 all weekend.",
  "notif.n3.time": "1d ago",

  // help
  "help.title": "Help Center",
  "help.subtitle": "We're here to help",
  "help.faqTitle": "Frequently asked",
  "help.liveChat": "Live Chat",
  "help.liveChatDetail": "Avg reply under 2 min",
  "help.call": "Call Support",
  "help.email": "Email Us",
  "help.startChat": "Start a live chat",
  "help.startChatDetail": "Talk to our team right now",
  "faq.q1": "How does YesPiz routing work?",
  "faq.a1":
    "Every order is automatically matched to the nearest partner kitchen, so your pizza is made close by and delivered hot and fast.",
  "faq.q2": "Can I choose a specific restaurant?",
  "faq.a2":
    "YesPiz handles kitchen selection for you to guarantee the best quality and speed. You always get a verified partner kitchen.",
  "faq.q3": "How long does delivery take?",
  "faq.a3":
    "Most orders arrive in 25–35 minutes, depending on your distance from the nearest partner kitchen.",
  "faq.q4": "Is delivery really always free?",
  "faq.a4":
    "Yes — every YesPiz order ships with free delivery, no minimum spend and no hidden fees.",
  "faq.q5": "Do you offer refunds?",
  "faq.a5":
    "Yes. If your order doesn't meet our standards, contact support within 24 hours for a full resolution.",

  // settings
  "settings.title": "Settings",
  "settings.subtitle": "Manage your preferences",
  "settings.preferences": "PREFERENCES",
  "settings.darkMode": "Dark Mode",
  "settings.push": "Push Notifications",
  "settings.location": "Location Services",
  "settings.language": "LANGUAGE",
  "settings.addresses": "DELIVERY ADDRESSES",
  "settings.addAddress": "Add new address",
  "settings.account": "ACCOUNT",
  "settings.help": "Help Center",
  "settings.privacy": "Privacy & Security",
  "settings.terms": "Terms of Service",

  // partner dashboard
  "partner.title": "Partner Kitchen",
  "partner.subtitle": "Today's performance",
  "partner.stat.orders": "Today's Orders",
  "partner.stat.revenue": "Revenue",
  "partner.stat.prep": "Avg Prep Time",
  "partner.stat.acceptance": "Acceptance Rate",
  "partner.incoming": "Incoming",
  "partner.preparing": "Preparing",
  "partner.orderNum": "Order {id}",
  "partner.justNow": "Just now",
  "partner.oneMinAgo": "1 min ago",
  "partner.accept": "Accept {total}",
  "partner.minLeft": "{n} min left",
};

const de: Dict = {
  // common
  "common.total": "Gesamt",
  "common.subtotal": "Zwischensumme",
  "common.delivery": "Liefergebühr",
  "common.free": "Gratis",
  "common.freeDelivery": "Gratis Lieferung",
  "common.freeDeliveryNote": "Gratis Lieferung bei jeder Bestellung",
  "splash.tagline": "PREMIUM PIZZA, GELIEFERT",
  "settings.version": "YesPiz 3.0 · Version 3.0.0",
  "notFound.title": "Hoppla!",
  "notFound.message": "Diese Seite existiert nicht.",
  "notFound.goHome": "Zur Startseite!",
  "common.discount": "Rabatt",
  "common.item": "Artikel",
  "common.items": "Artikel",
  "common.browseMenu": "Menü ansehen",
  "common.logout": "Abmelden",
  "common.backToHome": "Zur Startseite",
  "common.min": "Min.",

  // partner badge
  "partner.nearYou": "Partnerküche in deiner Nähe",
  "partner.driver": "Partner-Fahrer",

  // nav
  "nav.home": "Start",
  "nav.menu": "Menü",
  "nav.orders": "Bestellungen",
  "nav.profile": "Profil",

  // order steps
  "step.received.label": "Bestellung erhalten",
  "step.received.hint": "Wir haben deine Bestellung",
  "step.kitchen.label": "Partnerküche gefunden",
  "step.kitchen.hint": "Nächste Küche zugeordnet",
  "step.preparing.label": "Wird zubereitet",
  "step.preparing.hint": "Frischer Teig im Ofen",
  "step.driver.label": "Fahrer zugewiesen",
  "step.driver.hint": "Partner-Fahrer unterwegs zur Küche",
  "step.onway.label": "Unterwegs",
  "step.onway.hint": "Auf dem Weg zu deiner Adresse",
  "step.delivered.label": "Geliefert",
  "step.delivered.hint": "Genieße dein YesPiz",

  // onboarding
  "onboarding.skip": "Überspringen",
  "onboarding.continue": "Weiter",
  "onboarding.getStarted": "Loslegen",
  "onboarding.slide1.title": "Zehn Pizzen.\nKeine Kompromisse.",
  "onboarding.slide1.body":
    "Eine kuratierte Auswahl an Pizzen in Spitzenqualität, aus 48 Stunden fermentiertem Teig.",
  "onboarding.slide2.title": "Geliefert von der\nnächsten Küche.",
  "onboarding.slide2.body":
    "Wir leiten jede Bestellung an die nächste Partnerküche – heiß, schnell und frisch.",
  "onboarding.slide3.title": "Gratis Lieferung,\njedes Mal.",
  "onboarding.slide3.body":
    "Live-Tracking und ein Partner-Fahrer bringen dein YesPiz direkt zu dir – die Lieferung ist immer gratis.",

  // login
  "login.welcome": "Willkommen zurück",
  "login.subtitle": "Melde dich an und bestelle Pizza in Spitzenqualität in Minuten.",
  "login.apple": "Weiter mit Apple",
  "login.google": "Weiter mit Google",
  "login.email": "Weiter mit E-Mail",
  "login.terms": "Mit der Fortsetzung stimmst du unseren AGB & Datenschutzbestimmungen zu.",
  "login.tabOtp": "Telefon-OTP",
  "login.tabPassword": "E-Mail",
  "login.phone": "Telefonnummer",
  "login.phonePlaceholder": "+49 170 0000000",
  "login.code": "OTP-Code",
  "login.codePlaceholder": "000000",
  "login.sendOtp": "Code senden",
  "login.confirmOtp": "Bestätigen & weiter",
  "login.otpHint": "Dev-Bypass-Code: 000000",
  "login.firstName": "Vorname",
  "login.lastName": "Nachname",
  "login.emailLabel": "E-Mail",
  "login.password": "Passwort",
  "login.signIn": "Anmelden",
  "login.register": "Konto erstellen",
  "login.needAccount": "Neu hier? Registrieren",
  "login.haveAccount": "Bereits ein Konto? Anmelden",
  "login.offlineBanner": "Menü offline — gespeicherte Artikel",
  "login.errorGeneric": "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
  "payment.processing": "Wird verarbeitet…",
  "payment.error": "Zahlung fehlgeschlagen. Bitte erneut versuchen.",
  "payment.needAuth": "Bitte melde dich an, um zu bestellen.",
  "payment.needAddress": "Bitte zuerst eine Lieferadresse wählen.",
  "settings.addressLabel": "Bezeichnung",
  "settings.addressStreet": "Straße",
  "settings.addressCity": "Stadt",
  "settings.addressZip": "PLZ",
  "settings.saveAddress": "Adresse speichern",
  "settings.addressSaved": "Adresse gespeichert",

  // home
  "home.deliverTo": "Lieferung nach Hause",
  "home.greeting": "Hallo {name}",
  "home.search": "Menü durchsuchen",
  "home.chefsPick": "Empfehlung des Küchenchefs",

  // categories
  "category.All": "Alle",
  "category.Popular": "Beliebt",
  "category.Classic": "Klassisch",
  "category.Spicy": "Scharf",
  "category.Veggie": "Vegetarisch",
  "category.Premium": "Premium",

  // promos
  "promo.welcome.title": "30% RABATT",
  "promo.welcome.subtitle": "Deine erste YesPiz-Bestellung",
  "promo.welcome.badge": "WELCOME30",
  "promo.free.title": "Gratis Lieferung",
  "promo.free.subtitle": "Immer, bei jeder Bestellung",
  "promo.free.badge": "IMMER GRATIS",
  "promo.weekend.title": "Wochenend-Special",
  "promo.weekend.subtitle": "YesPiz Special für 12,90 €",
  "promo.weekend.badge": "WEEKEND",

  // menu
  "menu.title": "Menü",
  "menu.subtitle": "Zehn Pizzen, frisch zubereitet",
  "menu.search": "Pizzen suchen",
  "sort.Recommended": "Empfohlen",
  "sort.Top Rated": "Top bewertet",
  "sort.Fastest": "Am schnellsten",
  "sort.Price": "Preis",

  // pizza detail
  "pizza.freeDelivery": "Gratis Lieferung",
  "pizza.ingredients": "Zutaten",
  "pizza.chooseSize": "Größe wählen",
  "pizza.addExtras": "Extras hinzufügen",
  "pizza.quantity": "Menge",
  "pizza.base": "Basis",
  "pizza.addToCart": "In den Warenkorb",
  "pizza.notFound": "Pizza nicht gefunden",

  // sizes
  "size.small": "Klein",
  "size.medium": "Mittel",
  "size.large": "Groß",

  // extras
  "extra.extra-cheese": "Extra Käse",
  "extra.jalapenos": "Jalapeños",
  "extra.olives": "Oliven",
  "extra.garlic-dip": "Knoblauch-Dip",

  // cart
  "cart.title": "Dein Warenkorb",
  "cart.empty": "Dein Warenkorb ist leer",
  "cart.emptyBody": "Füge eine Pizza aus dem Menü hinzu, um zu starten.",
  "cart.promoApply": "Gutscheincode WELCOME30 einlösen",
  "cart.promoApplied": "WELCOME30 aktiv – 30% Rabatt",
  "cart.discountLabel": "Rabatt (30%)",
  "cart.checkout": "Zur Kasse",

  // checkout
  "checkout.title": "Kasse",
  "checkout.subtitle": "Lieferdetails bestätigen",
  "checkout.address": "Lieferadresse",
  "checkout.time": "Lieferzeit",
  "checkout.leaveAtDoor": "An der Tür abstellen",
  "checkout.partnerNote":
    "Deine Bestellung wird der nächsten Partnerküche zugeordnet – für frischeste, schnellste Lieferung.",
  "checkout.continuePayment": "Weiter zur Zahlung",
  "time.asap": "Sofort (25–35 Min.)",
  "time.45": "In 45 Min.",
  "time.1hour": "In 1 Stunde",
  "time.later": "Später planen",

  // payment
  "payment.title": "Zahlung",
  "payment.subtitle": "Zahlungsart wählen",
  "payment.visa": "Visa",
  "payment.visaDetail": "•••• 4291",
  "payment.apple": "Apple Pay",
  "payment.appleDetail": "Standard-Wallet",
  "payment.cash": "Barzahlung bei Lieferung",
  "payment.cashDetail": "Beim Partner-Fahrer bezahlen",
  "payment.addCard": "Neue Karte hinzufügen",
  "payment.summary": "Bestellübersicht",
  "payment.pay": "{amount} bezahlen",

  // addresses
  "address.home": "Zuhause",
  "address.work": "Arbeit",

  // tracking
  "tracking.title": "Bestellverfolgung",
  "tracking.noActive": "Keine aktive Bestellung",
  "tracking.onWayToYou": "Auf dem Weg zu dir",
  "tracking.viewOrders": "Bestellungen ansehen",
  "tracking.minSuffix": "{n} Min.",

  // orders
  "orders.title": "Bestellungen",
  "orders.active": "Aktiv",
  "orders.history": "Verlauf",
  "orders.cancelled": "Storniert",
  "orders.delivered": "Geliefert",
  "orders.track": "Bestellung verfolgen",
  "orders.reorder": "Erneut bestellen",
  "orders.orderNum": "Bestellung #{id}",
  "orders.noActive": "Keine aktiven Bestellungen",
  "orders.noPast": "Keine vergangenen Bestellungen",
  "orders.emptyBody": "Sobald du bestellst, erscheint es hier.",

  // profile
  "profile.title": "Profil",
  "profile.tierGold": "GOLD",
  "profile.stats.orders": "Bestellungen",
  "profile.stats.favorites": "Favoriten",
  "profile.stats.points": "Punkte",
  "profile.darkMode": "Dunkelmodus",
  "profile.notifications": "Mitteilungen",
  "profile.addresses": "Lieferadressen",
  "profile.payment": "Zahlungsmethoden",
  "profile.partner": "Partner-Dashboard",
  "profile.help": "Hilfe-Center",
  "profile.settings": "Einstellungen",

  // notifications
  "notifications.title": "Mitteilungen",
  "notifications.unread": "{n} ungelesen",
  "notifications.caughtUp": "Alles gelesen",
  "notifications.markAll": "Alle markieren",
  "notif.n1.title": "Dein YesPiz ist unterwegs",
  "notif.n1.body": "Ein Partner-Fahrer ist 8 Minuten entfernt.",
  "notif.n1.time": "Gerade eben",
  "notif.n2.title": "30% Rabatt auf deine nächste Bestellung",
  "notif.n2.body": "Nutze den Code WELCOME30 an der Kasse.",
  "notif.n2.time": "vor 2 Std.",
  "notif.n3.title": "Wochenend-Special ist da",
  "notif.n3.body": "Hol dir das YesPiz Special das ganze Wochenende für 12,90 €.",
  "notif.n3.time": "vor 1 Tag",

  // help
  "help.title": "Hilfe-Center",
  "help.subtitle": "Wir sind für dich da",
  "help.faqTitle": "Häufige Fragen",
  "help.liveChat": "Live-Chat",
  "help.liveChatDetail": "Antwort in unter 2 Min.",
  "help.call": "Support anrufen",
  "help.email": "E-Mail schreiben",
  "help.startChat": "Live-Chat starten",
  "help.startChatDetail": "Sprich jetzt mit unserem Team",
  "faq.q1": "Wie funktioniert das YesPiz-Routing?",
  "faq.a1":
    "Jede Bestellung wird automatisch der nächsten Partnerküche zugeordnet, damit deine Pizza in der Nähe zubereitet und heiß und schnell geliefert wird.",
  "faq.q2": "Kann ich ein bestimmtes Restaurant wählen?",
  "faq.a2":
    "YesPiz übernimmt die Küchenauswahl für dich, um beste Qualität und Geschwindigkeit zu garantieren. Du bekommst immer eine verifizierte Partnerküche.",
  "faq.q3": "Wie lange dauert die Lieferung?",
  "faq.a3":
    "Die meisten Bestellungen kommen in 25–35 Minuten an, je nach Entfernung zur nächsten Partnerküche.",
  "faq.q4": "Ist die Lieferung wirklich immer gratis?",
  "faq.a4":
    "Ja – jede YesPiz-Bestellung wird gratis geliefert, ohne Mindestbestellwert und ohne versteckte Gebühren.",
  "faq.q5": "Bietet ihr Erstattungen an?",
  "faq.a5":
    "Ja. Wenn deine Bestellung nicht unseren Standards entspricht, kontaktiere den Support innerhalb von 24 Stunden für eine vollständige Lösung.",

  // settings
  "settings.title": "Einstellungen",
  "settings.subtitle": "Verwalte deine Einstellungen",
  "settings.preferences": "EINSTELLUNGEN",
  "settings.darkMode": "Dunkelmodus",
  "settings.push": "Push-Mitteilungen",
  "settings.location": "Standortdienste",
  "settings.language": "SPRACHE",
  "settings.addresses": "LIEFERADRESSEN",
  "settings.addAddress": "Neue Adresse hinzufügen",
  "settings.account": "KONTO",
  "settings.help": "Hilfe-Center",
  "settings.privacy": "Datenschutz & Sicherheit",
  "settings.terms": "Nutzungsbedingungen",

  // partner dashboard
  "partner.title": "Partnerküche",
  "partner.subtitle": "Heutige Leistung",
  "partner.stat.orders": "Heutige Bestellungen",
  "partner.stat.revenue": "Umsatz",
  "partner.stat.prep": "Ø Zubereitungszeit",
  "partner.stat.acceptance": "Annahmequote",
  "partner.incoming": "Eingehend",
  "partner.preparing": "In Zubereitung",
  "partner.orderNum": "Bestellung {id}",
  "partner.justNow": "Gerade eben",
  "partner.oneMinAgo": "vor 1 Min.",
  "partner.accept": "{total} annehmen",
  "partner.minLeft": "noch {n} Min.",
};

export const translations: Record<Language, Dict> = { en, de };

export type Translator = (key: string, params?: Record<string, string | number>) => string;

export function makeTranslator(lang: Language): Translator {
  const dict = translations[lang] ?? en;
  return (key, params) => {
    let s = dict[key] ?? en[key] ?? key;
    if (params) {
      for (const k of Object.keys(params)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(params[k]));
      }
    }
    return s;
  };
}

type PizzaContent = { tagline: string; description: string; ingredients: string[] };

type PizzaLike = {
  id: string;
  tagline: string;
  description: string;
  ingredients: string[];
};

export function pizzaTagline(p: PizzaLike, lang: Language): string {
  if (lang === "de") return PIZZA_CONTENT_DE[p.id]?.tagline ?? p.tagline;
  return p.tagline;
}

export function pizzaDescription(p: PizzaLike, lang: Language): string {
  if (lang === "de") return PIZZA_CONTENT_DE[p.id]?.description ?? p.description;
  return p.description;
}

export function pizzaIngredients(p: PizzaLike, lang: Language): string[] {
  if (lang === "de") return PIZZA_CONTENT_DE[p.id]?.ingredients ?? p.ingredients;
  return p.ingredients;
}

export const PIZZA_CONTENT_DE: Record<string, PizzaContent> = {
  margherita: {
    tagline: "Der zeitlose Klassiker",
    description:
      "San-Marzano-Tomate, Fior di Latte und frisches Basilikum auf 48 Stunden fermentiertem Sauerteigboden.",
    ingredients: ["San-Marzano-Tomate", "Fior di Latte", "Frisches Basilikum", "Olivenöl"],
  },
  pepperoni: {
    tagline: "Knusprig & würzig",
    description:
      "Mit knuspriger Pepperoni, geschmolzenem Mozzarella und einem Hauch Chili-Honig.",
    ingredients: ["Tomate", "Mozzarella", "Pepperoni", "Chili-Honig"],
  },
  salami: {
    tagline: "Kräftig & herzhaft",
    description:
      "Dünn geschnittene italienische Salami, Mozzarella und Oregano auf würziger Tomatenbasis.",
    ingredients: ["Tomate", "Mozzarella", "Italienische Salami", "Oregano"],
  },
  "bbq-chicken": {
    tagline: "Rauchig & süß",
    description:
      "Gegrilltes Hähnchen, rote Zwiebel und rauchige BBQ-Sauce auf blubberndem Mozzarella.",
    ingredients: ["BBQ-Sauce", "Mozzarella", "Gegrilltes Hähnchen", "Rote Zwiebel"],
  },
  "quattro-formaggi": {
    tagline: "Vier-Käse-Genuss",
    description:
      "Mozzarella, Gorgonzola, Parmesan und Fontina goldbraun geschmolzen.",
    ingredients: ["Mozzarella", "Gorgonzola", "Parmesan", "Fontina"],
  },
  diavola: {
    tagline: "Heiß und scharf",
    description:
      "Scharfe Salami, Chiliflocken und 'Nduja für einen feurigen, vollmundigen Genuss.",
    ingredients: ["Tomate", "Mozzarella", "Scharfe Salami", "Chiliflocken"],
  },
  tonno: {
    tagline: "Frisch von der Küste",
    description:
      "Fangfrischer Thunfisch, rote Zwiebel und Kapern auf frischer Tomatenbasis.",
    ingredients: ["Tomate", "Mozzarella", "Thunfisch", "Rote Zwiebel"],
  },
  vegetariana: {
    tagline: "Gartenfrisch",
    description:
      "Geröstete Paprika, Zucchini, Aubergine und Kirschtomaten, leicht gegrillt.",
    ingredients: ["Tomate", "Mozzarella", "Paprika", "Zucchini", "Aubergine"],
  },
  funghi: {
    tagline: "Erdig & aromatisch",
    description:
      "Sautierte Pilze, Mozzarella und Petersilie mit einem Hauch Knoblauch.",
    ingredients: ["Tomate", "Mozzarella", "Pilze", "Petersilie"],
  },
  "yespiz-special": {
    tagline: "Unser Signature-Meisterwerk",
    description:
      "San-Marzano-Basis, cremige Burrata, Prosciutto di Parma, wilder Rucola und gehobelter Trüffel.",
    ingredients: ["San Marzano", "Burrata", "Prosciutto", "Rucola", "Trüffel"],
  },
};
