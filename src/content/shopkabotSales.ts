type DemoConversation = {
  title: string;
  customer: string;
  bot: string;
  media?: string;
};

export const salesSeo = {
  title: "ShopKaBot \u2014 WhatsApp AI Chatbot for Businesses",
  description:
    "Automate WhatsApp replies with ShopKaBot. Train your AI with business data, reply in English, Hindi or Hinglish, send images and PDFs, and convert more enquiries at \u20B9999/month.",
} as const;

export const countdownParts = [
  { value: "00", label: "Hours" },
  { value: "32", label: "Minutes" },
  { value: "07", label: "Seconds" },
] as const;

export const trustBullets = [
  "AI Auto Replies",
  "Custom Business Training",
  "Sends Images & PDFs",
  "English, Hindi & Hinglish",
  "Setup Support Available",
] as const;

export const heroQuickStats = [
  "Launch Offer \u20B9999/month",
  "WhatsApp-first automation",
  "Built for Indian businesses",
] as const;

export const useCaseCards = [
  {
    icon: "storefront-outline",
    title: "Online Sellers",
    benefit: "Share product details, catalogs, and price replies instantly.",
  },
  {
    icon: "cube-outline",
    title: "Wholesalers",
    benefit: "Handle MOQ, catalog, stock, and payment questions without delay.",
  },
  {
    icon: "school-outline",
    title: "Coaching Classes",
    benefit: "Reply with fees, batches, timings, and brochure PDFs automatically.",
  },
  {
    icon: "cut-outline",
    title: "Salons & Clinics",
    benefit: "Turn appointment and service enquiries into confirmed bookings.",
  },
  {
    icon: "restaurant-outline",
    title: "Restaurants & Cafes",
    benefit: "Send menus, offers, and order details the moment customers ask.",
  },
  {
    icon: "color-wand-outline",
    title: "Studios & Workshops",
    benefit: "Answer package, slot, and portfolio questions in a natural way.",
  },
  {
    icon: "bag-handle-outline",
    title: "Local Shops",
    benefit: "Stay responsive even when store staff are busy with walk-ins.",
  },
  {
    icon: "construct-outline",
    title: "Service Providers",
    benefit: "Qualify leads and collect booking details with less back-and-forth.",
  },
] as const;

export const statCards = [
  { value: "24/7", label: "AI Customer Replies" },
  { value: "100+", label: "Business Use Cases" },
  { value: "3 Languages", label: "English, Hindi & Hinglish" },
  { value: "\u20B9999/month", label: "Launch Pricing" },
] as const;

export const howItWorksSteps = [
  {
    step: "Step 1",
    title: "Train Your AI",
    description:
      "Add input messages, rules, replies, product details, pricing, FAQs, policies, offers, delivery details, payment instructions, and media links.",
  },
  {
    step: "Step 2",
    title: "AI Understands the Customer",
    description:
      "ShopKaBot checks your training data and conversation summary to understand what the customer asked, what was already discussed, and what reply should come next.",
  },
  {
    step: "Step 3",
    title: "Reply With Text, Images & PDFs",
    description:
      "ShopKaBot replies instantly and can send the right catalog, product image, menu, brochure, price list, or document.",
  },
  {
    step: "Step 4",
    title: "Convert More Leads",
    description:
      "The AI replies based on your business aim, so conversations move toward enquiry, booking, purchase, payment, or demo.",
  },
] as const;

export const comparisonCards = [
  {
    title: "Basic Auto Reply",
    tone: "muted",
    example: "Please check our catalog.",
  },
  {
    title: "ShopKaBot AI Reply",
    tone: "highlight",
    example:
      "Sure \u{1F60A} I'm sharing our latest catalog PDF. Please check it and send screenshots of the products you like. I'll confirm price and availability.",
  },
] as const;

export const demoConversationCards: readonly DemoConversation[] = [
  {
    title: "Demo 1",
    customer: "Catalog bhejo",
    bot:
      "Sure \u{1F60A} Here is our latest catalog PDF. Please check it and share screenshots of the products you like.",
    media: "\u{1F4C4} Latest Catalog PDF",
  },
  {
    title: "Demo 2",
    customer: "Price kya hai?",
    bot:
      "Sure \u{1F60A} Aap kis product ka price pooch rahe ho? Product name ya screenshot bhej do, main price aur availability confirm kar dunga.",
  },
  {
    title: "Demo 3",
    customer: "Product photo dikhao",
    bot:
      "Sure \u{1F60A} I'm sharing product images below. Please tell me which one you like.",
    media: "\u{1F5BC} Product images",
  },
  {
    title: "Demo 4",
    customer: "Delivery available hai?",
    bot:
      "Yes, delivery available hai \u{1F60A} Please apna city ya pincode share kar do, main delivery option aur charges confirm kar dunga.",
  },
  {
    title: "Demo 5",
    customer: "Appointment milega?",
    bot:
      "Sure \u{1F60A} Please share your preferred date and time. I'll help you with available slots.",
  },
] as const;

export const featureCards = [
  {
    icon: "sparkles-outline",
    title: "AI Auto Replies",
    description: "Reply instantly to incoming WhatsApp enquiries without waiting for staff.",
  },
  {
    icon: "library-outline",
    title: "Training Knowledge Base",
    description: "Feed the bot your product details, FAQs, rules, pricing, and policies.",
  },
  {
    icon: "document-text-outline",
    title: "Conversation Summarizer",
    description: "Help the AI understand what has already happened in the chat.",
  },
  {
    icon: "flag-outline",
    title: "Business Aim-Based Replies",
    description: "Guide replies toward booking, purchase, lead capture, or payment.",
  },
  {
    icon: "language-outline",
    title: "English, Hindi & Hinglish",
    description: "Talk to customers in the tone and language they naturally use.",
  },
  {
    icon: "image-outline",
    title: "Send Product Images",
    description: "Share product photos automatically when customers ask to see options.",
  },
  {
    icon: "document-attach-outline",
    title: "Send Catalog PDFs",
    description: "Deliver catalogs, brochures, menus, and course details in one click.",
  },
  {
    icon: "shuffle-outline",
    title: "Smart Media Matching",
    description: "Match the right file or image to the customer's message and context.",
  },
  {
    icon: "flask-outline",
    title: "Testing Dashboard",
    description: "Preview replies before you make the chatbot live for real customers.",
  },
  {
    icon: "logo-whatsapp",
    title: "WhatsApp Business Setup Support",
    description: "Get help connecting the business number and preparing the workspace.",
  },
  {
    icon: "people-outline",
    title: "Personal Setup Help",
    description: "Train faster with guided support instead of figuring everything out alone.",
  },
] as const;

export const ctaBlocks = [
  {
    title: "Reply Faster. Sell Smarter.",
    description:
      "Customers do not wait. ShopKaBot helps your business reply instantly, share the right information, send media, and move customers toward purchase or booking.",
    buttonLabel: "Get Instant Access",
    bullets: ["AI Chatbot", "Image & PDF Sharing", "\u20B9999/month Launch Offer"],
  },
  {
    title: "Send Catalogs, Menus & Product Images Automatically",
    description:
      "When customers ask for details, ShopKaBot can send the right image, PDF, brochure, menu, or document instantly.",
    buttonLabel: "Start Now",
    bullets: [
      "Catalog PDFs",
      "Product Images",
      "Brochures & Menus",
      "Payment Instructions",
    ],
  },
  {
    title: "Perfect for Indian Businesses",
    description:
      "ShopKaBot can reply in English, Hindi, and Hinglish, so your WhatsApp conversations feel natural to your customers.",
    buttonLabel: "Start Your WhatsApp AI Chatbot",
    bullets: ["English", "Hindi", "Hinglish", "Natural customer conversations"],
  },
] as const;

export const pricingFeatures = [
  "Full WhatsApp AI Chatbot",
  "AI Auto Replies",
  "Custom Training Data",
  "Input Message + Rule + Reply Setup",
  "Conversation Summary Context",
  "Business Aim-Based Replies",
  "English, Hindi & Hinglish Replies",
  "Image Sharing",
  "PDF & Document Sharing",
  "Testing Dashboard",
  "WhatsApp Business Setup Guidance",
  "Personal Training Support",
] as const;

export const businessProofCards = [
  {
    icon: "time-outline",
    badge: "24/7 Response Cover",
    title: "Stay responsive even when your team is busy",
    text:
      "ShopKaBot can handle first-response questions like catalog requests, pricing, timing, delivery, and availability without making buyers wait.",
    highlights: ["Instant first reply", "Works after hours", "Less missed intent"],
    outcome: "Ideal for lean teams that cannot watch WhatsApp all day.",
  },
  {
    icon: "document-attach-outline",
    badge: "Media + Context",
    title: "Send the right catalog, image, or PDF automatically",
    text:
      "Instead of replying with one generic line, the AI can share brochures, menus, price lists, course details, and product photos based on the conversation.",
    highlights: ["Catalog PDFs", "Product images", "Brochures and menus"],
    outcome: "Useful for sellers, coaching businesses, clinics, and service brands.",
  },
  {
    icon: "git-network-outline",
    badge: "Lead Qualification",
    title: "Move chats toward booking, enquiry, or payment",
    text:
      "The bot can ask clarifying questions, collect the next detail, and keep buyers moving instead of ending the conversation too early.",
    highlights: ["Captures buyer intent", "Reduces back-and-forth", "Supports handoff"],
    outcome: "Best for businesses that want WhatsApp to generate real pipeline, not just replies.",
  },
  {
    icon: "language-outline",
    badge: "India-First Conversations",
    title: "Reply in the language customers naturally use",
    text:
      "ShopKaBot supports English, Hindi, and Hinglish, so messages feel familiar whether the enquiry is about products, fees, bookings, or service details.",
    highlights: ["English", "Hindi", "Hinglish"],
    outcome: "Helps conversations feel natural across local and regional audiences.",
  },
] as const;

export const faqItems = [
  {
    question: "What is ShopKaBot?",
    answer:
      "ShopKaBot is a WhatsApp AI chatbot that replies to customer messages using your business training data, conversation context, and business aim.",
  },
  {
    question: "Is ShopKaBot only an auto-reply tool?",
    answer:
      "No. It is a full AI chatbot. It can understand customer messages, use your training data, remember conversation context, reply in multiple languages, and send images or PDFs.",
  },
  {
    question: "What is training data?",
    answer:
      "Training data includes your input messages, rules, replies, FAQs, product details, pricing, policies, offers, and business instructions.",
  },
  {
    question: "What is conversation summary?",
    answer:
      "ShopKaBot summarizes the chat so AI understands what has already happened in the conversation and gives better replies.",
  },
  {
    question: "What is business aim?",
    answer:
      "Business aim tells the AI what your goal is, such as generating leads, selling products, booking appointments, qualifying buyers, or providing support.",
  },
  {
    question: "Can ShopKaBot reply in Hindi or Hinglish?",
    answer: "Yes. ShopKaBot can reply in English, Hindi, and Hinglish.",
  },
  {
    question: "Can ShopKaBot send images and PDFs?",
    answer:
      "Yes. It can send product images, catalog PDFs, menus, brochures, price lists, course details, and documents.",
  },
  {
    question: "Can I test the chatbot before going live?",
    answer:
      "Yes. You can test replies from the dashboard before connecting it with real customers.",
  },
  {
    question: "How much does it cost?",
    answer: "The launch plan is priced at \u20B9999/month.",
  },
  {
    question: "Do you help with setup?",
    answer:
      "Yes. Setup and training support is available so your business can start quickly.",
  },
] as const;

export const footerBullets = [
  "Full WhatsApp AI Chatbot",
  "Text + Images + PDFs",
  "English, Hindi & Hinglish",
  "\u20B9999/month Launch Plan",
  "Setup Support Available",
] as const;
