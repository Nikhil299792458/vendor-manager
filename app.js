const DRIVE_FILE_NAME = "Vendor Manager Database.json";
const STORAGE_KEY = "vendor-manager-web-db";
const CLIENT_ID_KEY = "vendor-manager-google-client-id";
const DRIVE_FILE_ID_KEY = "vendor-manager-drive-file-id";

const defaultSettings = {
  categories: [
    "Bearings", "Shafts", "Fasteners", "Springs", "Gears", "Couplings", "Seals",
    "Pneumatics", "Hydraulics", "CNC Machining", "Laser Cutting", "Welding",
    "Sheet Metal", "Casting", "3D Printing", "Instrumentation", "Electrical",
    "Sensors", "Lab Equipment", "Custom Fabrication"
  ],
  vendorTypes: ["Supplier", "Manufacturer", "Fabricator", "Distributor", "Trader", "Service Provider"],
  verificationStatuses: ["Unverified", "Verified", "Inactive", "Duplicate", "Needs Followup"],
  lifecycleStatuses: [
    "New Vendor", "Shortlisted", "Contacted", "RFQ Sent", "Quotation Received",
    "Compared", "Approved", "Order Placed", "Delivered", "Rated", "Preferred",
    "Blacklisted", "Inactive"
  ],
  interactionModes: ["Call", "Email", "WhatsApp", "Visit", "Quotation", "Order"],
  interactionStatuses: ["Pending", "Contacted", "Quotation Received", "Order Placed", "Closed"],
  rfqStatuses: ["Draft", "Shortlisted", "RFQ Sent", "Quotation Received", "Compared", "Approved", "Order Placed", "Delivered", "Closed"],
  documentTypes: ["Catalogue", "Quotation", "Proforma Invoice", "Purchase Order", "Delivery Challan", "GST Certificate", "Calibration Certificate", "Warranty Document", "Other"],
  reminderPriorities: ["Low", "Medium", "High", "Critical"],
  weights: {
    qualityScore: 0.25,
    priceScore: 0.20,
    deliveryScore: 0.20,
    responseScore: 0.15,
    technicalCapabilityScore: 0.15,
    catalogueAvailabilityScore: 0.05
  }
};

const scoreLabels = {
  priceScore: "Price",
  qualityScore: "Quality",
  deliveryScore: "Delivery",
  responseScore: "Response",
  technicalCapabilityScore: "Technical Capability",
  catalogueAvailabilityScore: "Catalogue Availability"
};

const vendorColumns = [
  "companyName",
  "vendorType",
  "category",
  "subCategory",
  "tags",
  "productsServices",
  "brandsSupplied",
  "city",
  "area",
  "fullAddress",
  "phone",
  "whatsapp",
  "email",
  "website",
  "gstNumber",
  "contactPerson",
  "contactRole",
  "typicalLeadTimeDays",
  "moq",
  "paymentTerms",
  "technicalCapabilities",
  "verificationStatus",
  "lifecycleStatus",
  "notes"
];

const vendorColumnLabels = {
  companyName: "Company Name",
  vendorType: "Vendor Type",
  category: "Category",
  subCategory: "Sub-category",
  tags: "Tags",
  productsServices: "Products / Services",
  brandsSupplied: "Brands Supplied",
  city: "City",
  area: "Area",
  fullAddress: "Full Address",
  phone: "Phone",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
  gstNumber: "GST Number",
  contactPerson: "Contact Person",
  contactRole: "Contact Role",
  typicalLeadTimeDays: "Typical Lead Time Days",
  moq: "MOQ",
  paymentTerms: "Payment Terms",
  technicalCapabilities: "Technical Capabilities",
  verificationStatus: "Verification Status",
  lifecycleStatus: "Lifecycle Status",
  notes: "Notes"
};

let db = loadDb();
let accessToken = "";
let tokenClient = null;
let currentDetailVendorId = "";
let ocrExtractedRecord = null;

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  bindVendorForm();
  bindBusinessCardOcr();
  bindRfqForm();
  bindComparison();
  bindCatalogueForm();
  bindDocumentForm();
  bindQuotationForm();
  bindInteractionForm();
  bindReminderForm();
  bindScoreForm();
  bindImportExport();
  bindDrive();
  bindSettings();
  bindDetailActions();
  populateStaticOptions();
  registerServiceWorker();
  renderAll();
});

function cloneSettings() {
  return JSON.parse(JSON.stringify(defaultSettings));
}

function defaultDb() {
  return {
    meta: {
      app: "Vendor Manager Web",
      version: 2,
      updatedAt: new Date().toISOString(),
      driveFileId: localStorage.getItem(DRIVE_FILE_ID_KEY) || ""
    },
    settings: cloneSettings(),
    vendors: sampleVendors(),
    catalogues: [],
    documents: [],
    quotations: [],
    interactions: [],
    reminders: [],
    rfqs: [],
    scores: [],
    auditLog: []
  };
}

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultDb();
  try {
    return normalizeDb(JSON.parse(raw));
  } catch {
    return defaultDb();
  }
}

function normalizeDb(value) {
  const settings = {
    ...cloneSettings(),
    ...(value.settings || {}),
    weights: { ...defaultSettings.weights, ...((value.settings || {}).weights || {}) }
  };
  return {
    meta: {
      app: "Vendor Manager Web",
      version: 2,
      updatedAt: new Date().toISOString(),
      driveFileId: localStorage.getItem(DRIVE_FILE_ID_KEY) || "",
      ...(value.meta || {})
    },
    settings,
    vendors: (value.vendors || []).map(normalizeVendor),
    catalogues: value.catalogues || [],
    documents: value.documents || [],
    quotations: (value.quotations || []).map(normalizeQuotation),
    interactions: value.interactions || [],
    reminders: value.reminders || [],
    rfqs: value.rfqs || [],
    scores: value.scores || [],
    auditLog: value.auditLog || []
  };
}

function normalizeVendor(vendor) {
  return {
    id: vendor.id || uid(),
    companyName: vendor.companyName || "",
    vendorType: vendor.vendorType || "Supplier",
    category: vendor.category || "Custom Fabrication",
    subCategory: vendor.subCategory || "",
    tags: vendor.tags || "",
    productsServices: vendor.productsServices || "",
    brandsSupplied: vendor.brandsSupplied || "",
    city: vendor.city || "Bangalore",
    area: vendor.area || "",
    fullAddress: vendor.fullAddress || "",
    phone: vendor.phone || "",
    whatsapp: vendor.whatsapp || "",
    email: vendor.email || "",
    website: vendor.website || "",
    indiaMartUrl: vendor.indiaMartUrl || "",
    justDialUrl: vendor.justDialUrl || "",
    gstNumber: vendor.gstNumber || vendor.gst || "",
    contactPerson: vendor.contactPerson || "",
    contactRole: vendor.contactRole || "",
    technicalCapabilities: vendor.technicalCapabilities || "",
    moq: vendor.moq || "",
    typicalLeadTimeDays: Number(vendor.typicalLeadTimeDays || 0),
    paymentTerms: vendor.paymentTerms || "",
    notes: vendor.notes || "",
    createdAt: vendor.createdAt || new Date().toISOString(),
    updatedAt: vendor.updatedAt || new Date().toISOString(),
    lastVerifiedAt: vendor.lastVerifiedAt || "",
    verificationStatus: vendor.verificationStatus || "Unverified",
    lifecycleStatus: vendor.lifecycleStatus || "New Vendor"
  };
}

function normalizeQuotation(item) {
  return {
    id: item.id || uid(),
    rfqId: item.rfqId || "",
    vendorId: item.vendorId || "",
    itemName: item.itemName || "",
    specification: item.specification || "",
    quantity: Number(item.quantity || 0),
    quotedPrice: Number(item.quotedPrice || 0),
    currency: item.currency || "INR",
    leadTimeDays: Number(item.leadTimeDays || 0),
    gstPercent: Number(item.gstPercent || 0),
    shippingCost: Number(item.shippingCost || 0),
    delayPenalty: Number(item.delayPenalty || 0),
    warranty: item.warranty || "",
    paymentTerms: item.paymentTerms || item.quotationPaymentTerms || "",
    finalDecision: item.finalDecision || "",
    quotationDate: item.quotationDate || todayIso(),
    validityDate: item.validityDate || "",
    quotationFileUri: item.quotationFileUri || "",
    quotationFileName: item.quotationFileName || "",
    driveFileId: item.driveFileId || "",
    remarks: item.remarks || ""
  };
}

function saveLocal() {
  db.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db, null, 2));
}

function sampleVendors() {
  const now = new Date().toISOString();
  return [
    vendorSample("Demo Bearing Supply", "Supplier", "Bearings", "Peenya", "Ball bearings, bearing housings, pillow blocks", "DEMO-PHONE-001", "bearing; pillow block; shaft support"),
    vendorSample("Example Fastener Depot", "Distributor", "Fasteners", "SP Road", "Socket screws, washers, circlips, threaded inserts", "DEMO-PHONE-002", "socket screw; washer; circlip"),
    vendorSample("Sample Pneumatic Fittings", "Trader", "Pneumatics", "KR Market", "PU tubes, pneumatic fittings, FRL units, solenoid valves", "DEMO-PHONE-003", "PU tube; ferrule; regulator; solenoid"),
    vendorSample("Fictional CNC Works", "Fabricator", "CNC Machining", "Yeshwanthpur", "CNC milling, turning, jigs, fixtures, aluminum prototypes", "DEMO-PHONE-004", "CNC; aluminium; fixture; tolerance"),
    vendorSample("Demo Laser Cut Studio", "Service Provider", "Laser Cutting", "Peenya", "Laser cutting, bending, stainless profiles, brackets", "DEMO-PHONE-005", "laser cutting; SS sheet; bracket"),
    vendorSample("Mock Sheet Metal Fabrication", "Fabricator", "Sheet Metal", "Bommasandra", "Sheet-metal enclosures, bending, welding, powder coating", "DEMO-PHONE-006", "enclosure; bending; powder coating"),
    vendorSample("Illustrative Sensor Mart", "Supplier", "Sensors", "Electronic City", "Pressure sensors, thermocouples, flow switches", "DEMO-PHONE-007", "thermocouple; pressure sensor; DAQ"),
    vendorSample("Example Lab Equipment House", "Supplier", "Lab Equipment", "Indiranagar", "Lab stands, burners, gauges, calibration accessories", "DEMO-PHONE-008", "calibration; lab stand; pressure gauge"),
    vendorSample("Demo Hydraulic Fittings", "Trader", "Hydraulics", "Rajajinagar", "Hydraulic hoses, BSP fittings, valves, clamps", "DEMO-PHONE-009", "BSP; hydraulic hose; valve"),
    vendorSample("Sample Custom Fabrication Lab", "Fabricator", "Custom Fabrication", "Jigani", "Welded frames, prototype fixtures, brackets", "DEMO-PHONE-010", "prototype; welding; SS frame")
  ].map((vendor) => ({ ...vendor, createdAt: now, updatedAt: now }));
}

function vendorSample(companyName, vendorType, category, area, productsServices, phone, tags = "") {
  return normalizeVendor({
    id: uid(),
    companyName,
    vendorType,
    category,
    tags,
    productsServices,
    brandsSupplied: "Demo brand only",
    city: "Bangalore",
    area,
    phone,
    email: companyName.toLowerCase().replaceAll(" ", ".") + "@example.com",
    website: "https://example.com/" + slugify(companyName),
    contactPerson: "Demo Contact",
    contactRole: "Sales",
    typicalLeadTimeDays: 7,
    paymentTerms: "Demo only",
    technicalCapabilities: "Fake sample capability entry. Replace with real technical limits.",
    notes: "Fake sample data only. Not a real vendor.",
    verificationStatus: "Unverified",
    lifecycleStatus: "New Vendor"
  });
}

function uid() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
}

function bindNavigation() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
}

function showView(name) {
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  const view = document.getElementById(`${name}View`);
  if (view) view.classList.add("active");
  document.querySelectorAll(".nav-button").forEach((item) => {
    const active = item.dataset.view === name || (name === "vendorDetail" && item.dataset.view === "vendors");
    item.classList.toggle("active", active);
  });
}

function populateStaticOptions() {
  fillSelect("vendorType", db.settings.vendorTypes);
  fillSelect("category", db.settings.categories);
  fillSelect("verificationStatus", db.settings.verificationStatuses);
  fillSelect("lifecycleStatus", db.settings.lifecycleStatuses);
  fillSelect("filterCategory", ["All", ...db.settings.categories]);
  fillSelect("filterVendorType", ["All", ...db.settings.vendorTypes]);
  fillSelect("filterStatus", ["All", ...db.settings.verificationStatuses]);
  fillSelect("filterLifecycle", ["All", ...db.settings.lifecycleStatuses]);
  fillSelect("interactionMode", db.settings.interactionModes);
  fillSelect("interactionStatus", db.settings.interactionStatuses);
  fillSelect("rfqCategory", db.settings.categories);
  fillSelect("rfqStatus", db.settings.rfqStatuses);
  fillSelect("documentType", db.settings.documentTypes);
  fillSelect("reminderPriority", db.settings.reminderPriorities);
  renderScoreInputs("scoreInputs", db.settings.weights);
  renderScoreInputs("settingsWeights", db.settings.weights, true);
}

function fillSelect(id, options, blankLabel = "") {
  const select = document.getElementById(id);
  if (!select) return;
  const current = select.value;
  select.innerHTML = "";
  if (blankLabel) {
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = blankLabel;
    select.appendChild(blank);
  }
  [...new Set(options)].forEach((option) => {
    const node = document.createElement("option");
    node.value = option === "All" ? "" : option;
    node.textContent = option || "All";
    select.appendChild(node);
  });
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function fillVendorSelects() {
  const options = db.vendors
    .slice()
    .sort((a, b) => a.companyName.localeCompare(b.companyName))
    .map((vendor) => ({ value: vendor.id, label: vendor.companyName }));
  ["catalogueVendor", "documentVendor", "quotationVendor", "interactionVendor", "reminderVendor", "scoreVendor"].forEach((id) => fillObjectSelect(id, options));
  fillObjectSelect("rfqVendors", options, true);
}

function fillRfqSelects() {
  const options = db.rfqs
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map((rfq) => ({ value: rfq.id, label: rfq.title }));
  fillObjectSelect("quotationRfq", options, false, "No RFQ");
  fillObjectSelect("compareRfq", options, false, "All RFQs");
}

function fillObjectSelect(id, options, multiple = false, blankLabel = "") {
  const select = document.getElementById(id);
  if (!select) return;
  const current = multiple ? [...select.selectedOptions].map((option) => option.value) : select.value;
  select.innerHTML = "";
  if (blankLabel && !multiple) {
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = blankLabel;
    select.appendChild(blank);
  }
  options.forEach((option) => {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    select.appendChild(node);
  });
  if (multiple) {
    [...select.options].forEach((option) => {
      option.selected = current.includes(option.value);
    });
  } else if (options.some((option) => option.value === current)) {
    select.value = current;
  }
}

function renderAll() {
  fillVendorSelects();
  fillRfqSelects();
  renderDashboard();
  renderVendors();
  renderRfqs();
  renderComparison();
  renderCatalogues();
  renderDocuments();
  renderQuotations();
  renderInteractions();
  renderReminders();
  renderScoreForm();
  renderAnalytics();
  renderDriveState();
  renderSettings();
  if (currentDetailVendorId) renderVendorDetail(currentDetailVendorId);
}

function bindVendorForm() {
  ["vendorSearch", "filterCategory", "filterVendorType", "filterStatus", "filterLifecycle", "sortVendors"].forEach((id) => {
    on(id, "input", renderVendors);
  });
  on("newVendorBtn", "click", resetVendorForm);
  on("resetVendorFormBtn", "click", resetVendorForm);
  on("deleteVendorBtn", "click", deleteSelectedVendor);
  on("vendorForm", "submit", (event) => {
    event.preventDefault();
    const vendor = formToVendor();
    const validation = validateVendor(vendor);
    if (validation) return showAlert(validation, "error");
    const duplicates = detectDuplicates(vendor);
    if (duplicates.length && !confirm(`Possible duplicate vendor found:\n${duplicates.join("\n")}\n\nSave anyway?`)) {
      showDuplicateWarning(duplicates);
      return;
    }
    const index = db.vendors.findIndex((item) => item.id === vendor.id);
    if (index >= 0) {
      db.vendors[index] = { ...db.vendors[index], ...vendor, updatedAt: new Date().toISOString() };
      audit("Updated", "Vendor", vendor.companyName);
    } else {
      const created = { ...vendor, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db.vendors.push(created);
      audit("Created", "Vendor", created.companyName);
    }
    saveLocal();
    resetVendorForm();
    renderAll();
    showAlert("Vendor saved.", "success");
  });
}

function formToVendor() {
  return normalizeVendor({
    id: value("vendorId"),
    companyName: value("companyName"),
    vendorType: value("vendorType"),
    category: value("category"),
    tags: value("tags"),
    subCategory: value("subCategory"),
    productsServices: value("productsServices"),
    brandsSupplied: value("brandsSupplied"),
    city: value("city"),
    area: value("area"),
    fullAddress: value("fullAddress"),
    phone: value("phone"),
    whatsapp: value("whatsapp"),
    email: value("email"),
    website: value("website"),
    indiaMartUrl: value("indiaMartUrl"),
    justDialUrl: value("justDialUrl"),
    gstNumber: value("gstNumber"),
    contactPerson: value("contactPerson"),
    contactRole: value("contactRole"),
    typicalLeadTimeDays: numberValue("typicalLeadTimeDays"),
    moq: value("moq"),
    paymentTerms: value("paymentTerms"),
    technicalCapabilities: value("technicalCapabilities"),
    verificationStatus: value("verificationStatus"),
    lifecycleStatus: value("lifecycleStatus"),
    notes: value("notes"),
    lastVerifiedAt: ""
  });
}

function validateVendor(vendor) {
  if (!vendor.companyName) return "Company name is required.";
  if (vendor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.email)) return "Enter a valid email address.";
  if (vendor.phone && !/^(\+?\d[\d\s-]{6,}|DEMO-PHONE-\d+)$/i.test(vendor.phone)) return "Enter a valid phone number or demo placeholder.";
  if (vendor.website && !isValidUrl(vendor.website)) return "Enter a valid website URL.";
  return "";
}

function setVendorFormFromRecord(record) {
  vendorColumns.forEach((key) => {
    const field = document.getElementById(key);
    if (field) field.value = record[key] ?? "";
  });
  document.getElementById("vendorId").value = record.id || "";
  document.getElementById("vendorFormTitle").textContent = record.id ? "Edit Vendor" : "Add Vendor";
  document.getElementById("deleteVendorBtn").classList.toggle("hidden", !record.id);
}

function editVendor(id) {
  const vendor = db.vendors.find((item) => item.id === id);
  if (!vendor) return;
  document.getElementById("vendorId").value = vendor.id;
  setVendorFormFromRecord(vendor);
  document.getElementById("vendorFormTitle").textContent = "Edit Vendor";
  document.getElementById("deleteVendorBtn").classList.remove("hidden");
  showView("vendors");
}

function deleteSelectedVendor() {
  const id = value("vendorId");
  deleteVendorById(id);
}

function deleteVendorById(id) {
  if (!id) return showAlert("Choose a vendor to delete first.", "error");
  const linkedCount = linkedRecordCount(id);
  const message = [
    `Are you sure you want to delete "${vendorName(id)}"?`,
    "",
    `This will also delete ${linkedCount} linked record${linkedCount === 1 ? "" : "s"} from this local database.`,
    "This action cannot be undone unless you restore from a backup."
  ].join("\n");
  if (!confirm(message)) return;
  const label = vendorName(id);
  db.vendors = db.vendors.filter((item) => item.id !== id);
  db.catalogues = db.catalogues.filter((item) => item.vendorId !== id);
  db.documents = db.documents.filter((item) => item.vendorId !== id);
  db.quotations = db.quotations.filter((item) => item.vendorId !== id);
  db.interactions = db.interactions.filter((item) => item.vendorId !== id);
  db.reminders = db.reminders.filter((item) => item.vendorId !== id);
  db.scores = db.scores.filter((item) => item.vendorId !== id);
  db.rfqs.forEach((rfq) => {
    rfq.vendorIds = (rfq.vendorIds || []).filter((vendorId) => vendorId !== id);
  });
  audit("Deleted", "Vendor", label);
  saveLocal();
  if (currentDetailVendorId === id) currentDetailVendorId = "";
  resetVendorForm();
  renderAll();
  showView("vendors");
  showAlert("Vendor deleted.", "success");
}

function resetVendorForm() {
  document.getElementById("vendorForm").reset();
  document.getElementById("vendorId").value = "";
  document.getElementById("city").value = "Bangalore";
  document.getElementById("vendorFormTitle").textContent = "Add Vendor";
  document.getElementById("deleteVendorBtn").classList.add("hidden");
  document.getElementById("duplicateWarning").classList.add("hidden");
}

function bindBusinessCardOcr() {
  on("extractBusinessCardBtn", "click", extractBusinessCardImage);
  on("clearOcrBtn", "click", clearOcrReview);
  on("copyOcrToVendorFormBtn", "click", copyOcrToVendorForm);
  on("saveOcrVendorBtn", "click", saveOcrVendor);
}

async function extractBusinessCardImage() {
  const file = document.getElementById("ocrCardImage").files[0];
  if (!file) return showAlert("Choose a business card image first.", "error");
  if (!window.Tesseract?.recognize) return showAlert("Tesseract.js has not loaded yet. Check your internet connection and reload.", "error");
  setOcrStatus("Preparing image for browser OCR...");
  try {
    const image = await prepareBusinessCardImage(file);
    setOcrStatus("Running OCR in your browser...");
    const result = await Tesseract.recognize(image, "eng", {
      logger: (progress) => updateOcrProgress(progress)
    });
    const text = normalizeOcrText(result.data?.text || "");
    const record = extractBusinessCardFields(text);
    const payload = { record, rawText: text, rawLines: getCleanOcrLines(text) };
    ocrExtractedRecord = prepareOcrRecord(payload.record);
    renderOcrReview(payload);
    setOcrStatus("Extraction complete. Review every field before saving.");
    showAlert("OCR extraction complete. Please verify before saving.", "success");
  } catch (error) {
    setOcrStatus("OCR extraction failed.");
    showAlert(`Could not extract card: ${error.message}`, "error");
  }
}

function updateOcrProgress(progress) {
  const status = progress.status ? progress.status.replace(/_/g, " ") : "working";
  const percent = Number(progress.progress || 0);
  setOcrStatus(`${status}: ${Math.round(percent * 100)}%`);
}

async function prepareBusinessCardImage(file) {
  const img = await loadImage(file);
  const targetWidth = 1800;
  const scale = img.naturalWidth && img.naturalWidth < targetWidth ? targetWidth / img.naturalWidth : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128));
    data[i] = contrast;
    data[i + 1] = contrast;
    data[i + 2] = contrast;
  }
  ctx.putImageData(imageData, 0, 0);
  URL.revokeObjectURL(img.dataset.objectUrl);
  return canvas;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      img.dataset.objectUrl = objectUrl;
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load selected image."));
    };
    img.src = objectUrl;
  });
}

function extractBusinessCardFields(text) {
  const lines = getCleanOcrLines(text);
  const emails = extractOcrEmails(text);
  const phones = extractOcrPhones(text);
  const websites = extractOcrWebsites(lines, emails);
  const contactRole = extractOcrContactRole(lines);
  const contactPerson = extractOcrContactPerson(lines, contactRole);
  const companyName = extractOcrCompanyName(lines);
  const location = extractOcrCityAndArea(lines, text);
  const inferred = inferOcrCategory(text);
  const address = extractOcrAddress(lines);
  const record = Object.fromEntries(vendorColumns.map((key) => [key, ""]));
  record.companyName = companyName;
  record.vendorType = inferred.vendorType || "Supplier";
  record.category = inferred.category;
  record.subCategory = inferred.subCategory;
  record.tags = inferred.tags;
  record.productsServices = inferred.productsServices;
  record.brandsSupplied = inferred.brandsSupplied;
  record.city = location.city;
  record.area = location.area;
  record.fullAddress = address.fullAddress;
  record.phone = phones[0] || "";
  record.whatsapp = phones[0] || "";
  record.email = emails[0] || "";
  record.website = websites[0] || "";
  record.gstNumber = extractOcrGstNumber(text);
  record.contactPerson = contactPerson;
  record.contactRole = contactRole;
  record.verificationStatus = "Needs Followup";
  record.lifecycleStatus = "New Vendor";
  record.notes = [
    address.notes,
    "OCR extracted in browser from business card. Verify before use.",
    companyName ? "" : "Company name may need manual entry."
  ].filter(Boolean).join("\n");
  return record;
}

function normalizeOcrText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\s*@\s*/g, "@")
    .replace(/\s*\.\s*/g, ".")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function getCleanOcrLines(text) {
  return uniquePreserveOrder(
    String(text || "")
      .split(/\n+/)
      .map((line) => line.trim().replace(/^[-:;,. ]+|[-:;,. ]+$/g, "").replace(/\s+/g, " "))
      .filter((line) => line.length >= 2)
  );
}

function uniquePreserveOrder(items) {
  const seen = new Set();
  const output = [];
  items.forEach((item) => {
    const key = String(item || "").toLowerCase().trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });
  return output;
}

function extractOcrEmails(text) {
  return uniquePreserveOrder(String(text || "").match(/\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/gi) || []);
}

function extractOcrWebsites(lines, emails) {
  const emailDomains = new Set(emails.map((email) => email.split("@").pop().toLowerCase()));
  const websites = [];
  const urlRegex = /\b(?:https?:\/\/)?(?:www\.)?[A-Z0-9\-]+(?:\.[A-Z0-9\-]+)+\/?\b/gi;
  lines.forEach((line) => {
    if (line.includes("@")) return;
    const matches = line.match(urlRegex) || [];
    matches.forEach((match) => {
      const candidate = match.trim().replace(/[.,;:]$/g, "");
      if (emailDomains.has(candidate.toLowerCase())) return;
      if (candidate.startsWith("www.") || candidate.startsWith("http")) websites.push(candidate);
    });
  });
  return uniquePreserveOrder(websites);
}

function extractOcrPhones(text) {
  const phones = [];
  const phoneRegex = /(?:\+?\d{1,3}[\s-]*)?(?:\d[\s-]*){8,12}/g;
  (String(text || "").match(phoneRegex) || []).forEach((raw) => {
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.length === 10) phones.push("+91" + digitsOnly);
    else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) phones.push("+" + digitsOnly);
    else if (digitsOnly.length > 7 && raw.trim().startsWith("+")) phones.push("+" + digitsOnly);
  });
  return uniquePreserveOrder(phones);
}

function extractOcrGstNumber(text) {
  const match = String(text || "").match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/i);
  return match ? match[0].toUpperCase() : "";
}

function extractOcrContactRole(lines) {
  const roleKeywords = [
    "account manager",
    "sales manager",
    "regional manager",
    "area manager",
    "business manager",
    "product manager",
    "application specialist",
    "technical specialist",
    "field engineer",
    "sales engineer",
    "director",
    "proprietor",
    "owner",
    "manager",
    "engineer",
    "executive"
  ];
  return lines.find((line) => roleKeywords.some((keyword) => line.toLowerCase().includes(keyword))) || "";
}

function extractOcrContactPerson(lines, contactRole) {
  if (contactRole && lines.includes(contactRole)) {
    const index = lines.indexOf(contactRole);
    for (let i = index - 1; i >= Math.max(0, index - 4); i--) {
      if (looksLikePersonName(lines[i])) return lines[i];
    }
  }
  return lines.find(looksLikePersonName) || "";
}

function looksLikePersonName(line) {
  const lower = String(line || "").toLowerCase();
  const rejectWords = [
    "scientific", "technologies", "technology", "solutions", "services", "private", "pvt",
    "ltd", "limited", "mobile", "phone", "email", "www", "india", "bengaluru",
    "bangalore", "road", "place", "manager", "engineer", "supplier", "manufacturer"
  ];
  if (rejectWords.some((word) => lower.includes(word))) return false;
  if (/\d/.test(line)) return false;
  const words = String(line || "").split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 5 && words.every((word) => /^[A-Za-z.]+$/.test(word));
}

function extractOcrCompanyName(lines) {
  const orgKeywords = [
    "scientific", "industries", "industry", "technologies", "technology", "systems",
    "corporation", "company", "enterprises", "traders", "distributors", "bioservices",
    "bio services", "pvt", "private", "ltd", "limited", "llp", "inc", "solutions",
    "engineering", "manufacturing", "fabrication", "tools", "automation"
  ];
  const rejectKeywords = [
    "mobile", "phone", "email", "www", "account manager", "manager", "bengaluru",
    "bangalore", "india", "road", "place", "whitefield"
  ];
  const candidates = lines.filter((line) => {
    const lower = line.toLowerCase();
    return !rejectKeywords.some((word) => lower.includes(word)) &&
      orgKeywords.some((word) => lower.includes(word));
  });
  if (candidates.length) return uniquePreserveOrder(candidates).slice(0, 3).join(" | ");
  return lines.find((line) => !looksLikePersonName(line) && !/\d/.test(line) && !line.includes("@") && !/^www\./i.test(line)) || "";
}

function extractOcrCityAndArea(lines, text) {
  const cityPatterns = {
    bengaluru: "Bengaluru",
    bangalore: "Bengaluru",
    mumbai: "Mumbai",
    pune: "Pune",
    chennai: "Chennai",
    hyderabad: "Hyderabad",
    delhi: "Delhi",
    "new delhi": "New Delhi",
    kolkata: "Kolkata",
    ahmedabad: "Ahmedabad"
  };
  const lowerText = String(text || "").toLowerCase();
  const cityKey = Object.keys(cityPatterns).find((key) => lowerText.includes(key));
  const city = cityKey ? cityPatterns[cityKey] : "";
  const areaKeywords = [
    "whitefield", "epip", "electronic city", "peenya", "jayanagar", "indiranagar",
    "koramangala", "rajajinagar", "yeshwanthpur", "bommasandra", "jigani", "sp road"
  ];
  let area = lines.find((line) => areaKeywords.some((keyword) => line.toLowerCase().includes(keyword))) || "";
  area = area.replace(/\b\d{6}\b/g, "").replace(/\bIndia\b/gi, "").replace(city, "").trim().replace(/^[,;-]+|[,;-]+$/g, "");
  return { city, area };
}

function inferOcrCategory(text) {
  const lower = String(text || "").toLowerCase();
  const rules = [
    ["Pneumatics", ["pneumatic", "pu tube", "frl", "solenoid", "air cylinder", "ferrule", "regulator"]],
    ["Hydraulics", ["hydraulic", "hose", "bsp", "valve", "clamp"]],
    ["Bearings", ["bearing", "pillow block", "linear bearing"]],
    ["Fasteners", ["fastener", "screw", "bolt", "washer", "circlip", "threaded insert"]],
    ["CNC Machining", ["cnc", "machining", "turning", "milling", "fixture", "tolerance"]],
    ["Laser Cutting", ["laser cutting", "laser cut"]],
    ["Sheet Metal", ["sheet metal", "bending", "powder coating", "enclosure"]],
    ["Sensors", ["sensor", "thermocouple", "transducer", "daq", "flow meter", "pressure gauge"]],
    ["Lab Equipment", ["laboratory", "lab equipment", "calibration", "burner", "life sciences"]],
    ["Custom Fabrication", ["fabrication", "welding", "prototype", "custom"]]
  ];
  const categoryRule = rules.find(([, keywords]) => keywords.some((keyword) => lower.includes(keyword)));
  const category = categoryRule ? categoryRule[0] : "";
  const tags = [];
  const brands = [];
  ["thermo fisher", "invitrogen", "parker", "festo", "smc", "bosch rexroth", "swagelok"].forEach((brand) => {
    if (lower.includes(brand)) {
      const label = brand.replace(/\b\w/g, (ch) => ch.toUpperCase());
      brands.push(label);
      tags.push(label);
    }
  });
  if (category) tags.push(category);
  return {
    vendorType: "",
    category,
    subCategory: category ? `${category} supplier` : "",
    productsServices: category || "",
    brandsSupplied: uniquePreserveOrder(brands).join(", "),
    tags: uniquePreserveOrder(tags).join(", ")
  };
}

function extractOcrAddress(lines) {
  const addressKeywords = [
    "road", "street", "place", "phase", "layout", "industrial", "estate", "epip",
    "whitefield", "bengaluru", "bangalore", "india", "nagar", "cross", "main"
  ];
  const addressLines = uniquePreserveOrder(lines.filter((line) => {
    const lower = line.toLowerCase();
    return addressKeywords.some((keyword) => lower.includes(keyword)) || /\b\d{6}\b/.test(line);
  }));
  return {
    fullAddress: addressLines.join("; "),
    notes: addressLines.length ? "Address extracted from card: " + addressLines.join("; ") : ""
  };
}

function prepareOcrRecord(record) {
  const prepared = normalizeVendor({
    ...Object.fromEntries(vendorColumns.map((key) => [key, record[key] || ""])),
    vendorType: record.vendorType || "Supplier",
    verificationStatus: normalizeOcrStatus(record.verificationStatus),
    lifecycleStatus: normalizeOcrLifecycle(record.lifecycleStatus),
    notes: [record.notes, "OCR extracted from business card. Manually verified before saving: pending."].filter(Boolean).join("\n")
  });
  prepared.id = "";
  return prepared;
}

function normalizeOcrStatus(status) {
  if (db.settings.verificationStatuses.includes(status)) return status;
  return "Needs Followup";
}

function normalizeOcrLifecycle(status) {
  if (db.settings.lifecycleStatuses.includes(status)) return status;
  if (String(status || "").toLowerCase() === "new") return "New Vendor";
  return "New Vendor";
}

function renderOcrReview(result = {}) {
  const panel = document.getElementById("ocrReviewPanel");
  const fields = document.getElementById("ocrReviewFields");
  const raw = document.getElementById("ocrRawText");
  panel.classList.remove("hidden");
  fields.innerHTML = "";
  vendorColumns.forEach((key) => {
    const label = document.createElement("label");
    label.textContent = vendorColumnLabels[key] || key;
    const input = ["productsServices", "technicalCapabilities", "notes"].includes(key)
      ? document.createElement("textarea")
      : document.createElement("input");
    input.dataset.ocrField = key;
    input.value = ocrExtractedRecord?.[key] ?? "";
    label.appendChild(input);
    fields.appendChild(label);
  });
  raw.textContent = result.rawText || result._rawOCRText || ocrExtractedRecord?._rawOCRText || "";
}

function readOcrReviewRecord() {
  const record = {};
  document.querySelectorAll("[data-ocr-field]").forEach((field) => {
    record[field.dataset.ocrField] = field.value.trim();
  });
  return prepareOcrRecord(record);
}

function copyOcrToVendorForm() {
  if (!ocrExtractedRecord) return showAlert("Extract a business card first.", "error");
  const record = readOcrReviewRecord();
  ensureOptionValues(record);
  populateStaticOptions();
  setVendorFormFromRecord(record);
  showView("vendors");
  showAlert("Copied OCR fields to the vendor form. Review and click Save Vendor.", "success");
}

function saveOcrVendor() {
  if (!ocrExtractedRecord) return showAlert("Extract a business card first.", "error");
  if (!confirm("Have you manually verified the OCR fields and corrected mistakes?")) return;
  const vendor = readOcrReviewRecord();
  const validation = validateVendor(vendor);
  if (validation) return showAlert(validation, "error");
  const duplicates = detectDuplicates(vendor);
  if (duplicates.length && !confirm(`Possible duplicate vendor found:\n${duplicates.join("\n")}\n\nSave OCR vendor anyway?`)) return;
  ensureOptionValues(vendor);
  db.vendors.push({ ...vendor, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  audit("Created", "Vendor from Business Card OCR", vendor.companyName);
  saveLocal();
  clearOcrReview(false);
  populateStaticOptions();
  renderAll();
  showView("vendors");
  showAlert("Verified OCR vendor saved.", "success");
}

function ensureOptionValues(vendor) {
  if (vendor.category && !db.settings.categories.includes(vendor.category)) db.settings.categories.push(vendor.category);
  if (vendor.vendorType && !db.settings.vendorTypes.includes(vendor.vendorType)) db.settings.vendorTypes.push(vendor.vendorType);
  if (vendor.verificationStatus && !db.settings.verificationStatuses.includes(vendor.verificationStatus)) db.settings.verificationStatuses.push(vendor.verificationStatus);
  if (vendor.lifecycleStatus && !db.settings.lifecycleStatuses.includes(vendor.lifecycleStatus)) db.settings.lifecycleStatuses.push(vendor.lifecycleStatus);
}

function clearOcrReview(clearFile = true) {
  ocrExtractedRecord = null;
  document.getElementById("ocrReviewPanel").classList.add("hidden");
  document.getElementById("ocrReviewFields").innerHTML = "";
  document.getElementById("ocrRawText").textContent = "";
  if (clearFile) document.getElementById("ocrCardImage").value = "";
  setOcrStatus("Waiting for an image.");
}

function setOcrStatus(message) {
  const status = document.getElementById("ocrStatus");
  if (status) status.textContent = message;
}

function renderVendors() {
  const query = value("vendorSearch");
  const category = value("filterCategory");
  const type = value("filterVendorType");
  const status = value("filterStatus");
  const lifecycle = value("filterLifecycle");
  const sort = value("sortVendors");
  let vendors = db.vendors.filter((vendor) => {
    return matchesVendorQuery(vendor, query) &&
      (!category || vendor.category === category || tagList(vendor.tags).includes(category.toLowerCase())) &&
      (!type || vendor.vendorType === type) &&
      (!status || vendor.verificationStatus === status) &&
      (!lifecycle || vendor.lifecycleStatus === lifecycle);
  });
  vendors = sortVendors(vendors, sort);
  const list = document.getElementById("vendorList");
  list.innerHTML = vendors.length ? "" : emptyHtml();
  vendors.forEach((vendor) => {
    const score = latestScore(vendor.id)?.overallScore || 0;
    const lead = Number(vendor.typicalLeadTimeDays || 0);
    list.appendChild(card(`
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(vendor.companyName)}</div>
          <div class="muted">${escapeHtml(vendor.category)} &middot; ${escapeHtml(vendor.vendorType)}</div>
        </div>
        <div class="chips">${chip(vendor.verificationStatus)}${chip(vendor.lifecycleStatus)}${chip("Score " + score.toFixed(1))}</div>
      </div>
      <div>${escapeHtml(vendor.area || vendor.city || "")}${lead ? ` &middot; Lead ${lead} days` : ""}</div>
      <div class="muted">${escapeHtml(vendor.productsServices || vendor.tags || "")}</div>
      <div class="muted">${escapeHtml(vendor.phone || vendor.email || "")}</div>
      <div class="form-actions">
        <button data-detail="${vendor.id}">Details</button>
        <button data-edit="${vendor.id}">Edit</button>
        <button class="danger" data-delete-vendor="${vendor.id}">Delete</button>
        ${vendor.website ? `<a href="${escapeAttr(normalizeUrl(vendor.website))}" target="_blank" rel="noreferrer"><button>Website</button></a>` : ""}
      </div>
    `));
  });
  list.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editVendor(button.dataset.edit));
  });
  list.querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", () => renderVendorDetail(button.dataset.detail));
  });
  list.querySelectorAll("[data-delete-vendor]").forEach((button) => {
    button.addEventListener("click", () => deleteVendorById(button.dataset.deleteVendor));
  });
}

function matchesVendorQuery(vendor, query) {
  const tokens = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const fields = [
    vendor.companyName, vendor.productsServices, vendor.category, vendor.subCategory, vendor.tags,
    vendor.brandsSupplied, vendor.city, vendor.area, vendor.phone, vendor.email, vendor.gstNumber,
    vendor.contactPerson, vendor.technicalCapabilities, vendor.paymentTerms
  ];
  const haystack = fields.join(" ").toLowerCase();
  const words = haystack.split(/[^a-z0-9+.-]+/).filter(Boolean);
  return tokens.every((token) => {
    return haystack.includes(token) || words.some((word) => similarity(token, word) >= 0.78);
  });
}

function sortVendors(vendors, sort) {
  return [...vendors].sort((a, b) => {
    if (sort === "Rating") return (latestScore(b.id)?.overallScore || 0) - (latestScore(a.id)?.overallScore || 0);
    if (sort === "Recently Updated") return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    if (sort === "Category") return `${a.category}${a.companyName}`.localeCompare(`${b.category}${b.companyName}`);
    if (sort === "Lead Time") return Number(a.typicalLeadTimeDays || 9999) - Number(b.typicalLeadTimeDays || 9999);
    return a.companyName.localeCompare(b.companyName);
  });
}

function bindDetailActions() {
  on("backToVendorsBtn", "click", () => showView("vendors"));
  on("detailEditBtn", "click", () => currentDetailVendorId && editVendor(currentDetailVendorId));
  on("detailWebsiteBtn", "click", () => openCurrentVendorWebsite());
  on("detailDeleteBtn", "click", () => currentDetailVendorId && deleteVendorById(currentDetailVendorId));
}

function openCurrentVendorWebsite() {
  const vendor = db.vendors.find((item) => item.id === currentDetailVendorId);
  if (!vendor?.website) return showAlert("No website saved for this vendor.", "error");
  window.open(normalizeUrl(vendor.website), "_blank", "noopener,noreferrer");
}

function renderVendorDetail(id) {
  const vendor = db.vendors.find((item) => item.id === id);
  if (!vendor) return;
  currentDetailVendorId = id;
  document.getElementById("detailTitle").textContent = vendor.companyName;
  const score = latestScore(id);
  const linkedCatalogues = db.catalogues.filter((item) => item.vendorId === id);
  const linkedDocuments = db.documents.filter((item) => item.vendorId === id);
  const linkedQuotes = db.quotations.filter((item) => item.vendorId === id);
  const linkedInteractions = db.interactions.filter((item) => item.vendorId === id);
  const linkedReminders = db.reminders.filter((item) => item.vendorId === id);
  const content = document.getElementById("vendorDetailContent");
  content.innerHTML = `
    <div class="detail-grid">
      <article class="panel">
        <h3>Company</h3>
        ${detailRow("Type", vendor.vendorType)}
        ${detailRow("Category", vendor.category)}
        ${detailRow("Tags", vendor.tags)}
        ${detailRow("Products", vendor.productsServices)}
        ${detailRow("Brands", vendor.brandsSupplied)}
        ${detailRow("Lifecycle", vendor.lifecycleStatus)}
        ${detailRow("Verification", vendor.verificationStatus)}
      </article>
      <article class="panel">
        <h3>Contact</h3>
        ${detailRow("Person", [vendor.contactPerson, vendor.contactRole].filter(Boolean).join(", "))}
        ${detailRow("Phone", vendor.phone)}
        ${detailRow("WhatsApp", vendor.whatsapp)}
        ${detailRow("Email", vendor.email)}
        ${detailRow("Website", vendor.website)}
        <div class="form-actions">${contactButtons(vendor)}</div>
      </article>
      <article class="panel">
        <h3>Procurement Notes</h3>
        ${detailRow("Area", [vendor.area, vendor.city].filter(Boolean).join(", "))}
        ${detailRow("GST", vendor.gstNumber)}
        ${detailRow("Lead Time", vendor.typicalLeadTimeDays ? `${vendor.typicalLeadTimeDays} days` : "")}
        ${detailRow("MOQ", vendor.moq)}
        ${detailRow("Payment", vendor.paymentTerms)}
        ${detailRow("Technical", vendor.technicalCapabilities)}
        ${detailRow("Notes", vendor.notes)}
      </article>
      <article class="panel">
        <h3>Score</h3>
        <div class="metric compact"><span>Overall</span><strong>${score ? score.overallScore.toFixed(2) : "0.00"}</strong></div>
        <p class="muted">${escapeHtml(score?.comments || "No score recorded.")}</p>
      </article>
    </div>
    <div class="two-column dashboard-band">
      ${detailList("Catalogues", linkedCatalogues.map((item) => `${item.title} (${item.linkStatus || "Unknown"})`))}
      ${detailList("Documents", linkedDocuments.map((item) => `${item.type}: ${item.title}`))}
      ${detailList("Quotations", linkedQuotes.map((item) => `${item.itemName} - ${item.currency} ${landedCost(item).toFixed(2)}`))}
      ${detailList("Interactions", linkedInteractions.map((item) => `${item.date}: ${item.summary}`))}
      ${detailList("Reminders", linkedReminders.map((item) => `${item.dueDate}: ${item.title} (${item.status})`))}
    </div>
  `;
  showView("vendorDetail");
}

function detailRow(label, valueText) {
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(valueText || "-")}</strong></div>`;
}

function detailList(title, rows) {
  return `<article class="panel"><h3>${escapeHtml(title)}</h3>${rows.length ? rows.map((row) => `<div class="mini-row">${escapeHtml(row)}</div>`).join("") : emptyHtml()}</article>`;
}

function contactButtons(vendor) {
  const buttons = [];
  if (vendor.phone) buttons.push(`<a href="tel:${escapeAttr(vendor.phone)}"><button>Call</button></a>`);
  if (vendor.whatsapp) buttons.push(`<a href="https://wa.me/${escapeAttr(digits(vendor.whatsapp))}" target="_blank" rel="noreferrer"><button>WhatsApp</button></a>`);
  if (vendor.email) buttons.push(`<a href="mailto:${escapeAttr(vendor.email)}"><button>Email</button></a>`);
  if (vendor.website) buttons.push(`<a href="${escapeAttr(normalizeUrl(vendor.website))}" target="_blank" rel="noreferrer"><button>Website</button></a>`);
  return buttons.join("");
}

function bindRfqForm() {
  on("rfqForm", "submit", (event) => {
    event.preventDefault();
    const rfq = {
      id: uid(),
      title: value("rfqTitle"),
      category: value("rfqCategory"),
      itemDescription: value("rfqItemDescription"),
      vendorIds: selectedValues("rfqVendors"),
      status: value("rfqStatus"),
      dueDate: value("rfqDueDate"),
      remarks: value("rfqRemarks"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!rfq.title || !rfq.itemDescription) return showAlert("RFQ title and requirement are required.", "error");
    db.rfqs.push(rfq);
    audit("Created", "RFQ", rfq.title);
    saveLocal();
    event.target.reset();
    renderAll();
    showAlert("RFQ saved.", "success");
  });
}

function renderRfqs() {
  const list = document.getElementById("rfqList");
  if (!list) return;
  list.innerHTML = db.rfqs.length ? "" : emptyHtml();
  db.rfqs.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).forEach((rfq) => {
    const quotes = db.quotations.filter((quote) => quote.rfqId === rfq.id);
    const nextStatus = nextFromList(db.settings.rfqStatuses, rfq.status);
    list.appendChild(card(`
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(rfq.title)}</div>
          <div class="muted">${escapeHtml(rfq.category)} &middot; Due ${escapeHtml(rfq.dueDate || "-")}</div>
        </div>
        <div class="chips">${chip(rfq.status)}${chip(`${quotes.length} quotes`)}</div>
      </div>
      <div>${escapeHtml(rfq.itemDescription)}</div>
      <div class="muted">Vendors: ${escapeHtml((rfq.vendorIds || []).map(vendorName).join(", ") || "-")}</div>
      <div class="form-actions">
        ${nextStatus ? `<button data-rfq-next="${rfq.id}">Move to ${escapeHtml(nextStatus)}</button>` : ""}
        <button data-compare-rfq="${rfq.id}">Compare quotes</button>
      </div>
    `));
  });
  list.querySelectorAll("[data-rfq-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const rfq = db.rfqs.find((item) => item.id === button.dataset.rfqNext);
      if (!rfq) return;
      rfq.status = nextFromList(db.settings.rfqStatuses, rfq.status);
      rfq.updatedAt = new Date().toISOString();
      audit("Advanced", "RFQ", `${rfq.title} to ${rfq.status}`);
      saveLocal();
      renderAll();
    });
  });
  list.querySelectorAll("[data-compare-rfq]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("compareRfq").value = button.dataset.compareRfq;
      showView("compare");
      renderComparison();
    });
  });
}

function bindComparison() {
  ["compareRfq", "compareItem"].forEach((id) => on(id, "input", renderComparison));
}

function renderComparison() {
  const container = document.getElementById("comparisonResult");
  if (!container) return;
  const rfqId = value("compareRfq");
  const itemQuery = value("compareItem").toLowerCase();
  let quotes = db.quotations.filter((quote) => {
    const matchesRfq = !rfqId || quote.rfqId === rfqId;
    const matchesItem = !itemQuery || [quote.itemName, quote.specification, quote.remarks].join(" ").toLowerCase().includes(itemQuery);
    return matchesRfq && matchesItem;
  });
  quotes = quotes.slice().sort((a, b) => landedCost(a) - landedCost(b));
  if (!quotes.length) {
    container.innerHTML = emptyHtml();
    return;
  }
  const best = quotes[0];
  container.innerHTML = `
    <article class="panel">
      <h3>Best landed cost: ${escapeHtml(vendorName(best.vendorId))}</h3>
      <p class="muted">${escapeHtml(best.itemName)} at ${escapeHtml(best.currency)} ${landedCost(best).toFixed(2)} landed cost.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Vendor</th><th>Item</th><th>Unit</th><th>GST</th><th>Shipping</th><th>Penalty</th><th>Landed</th><th>Lead</th><th>Score</th><th>Decision</th></tr></thead>
          <tbody>
            ${quotes.map((quote) => `
              <tr>
                <td>${escapeHtml(vendorName(quote.vendorId))}</td>
                <td>${escapeHtml(quote.itemName)}</td>
                <td>${escapeHtml(quote.currency)} ${Number(quote.quotedPrice || 0).toFixed(2)}</td>
                <td>${Number(quote.gstPercent || 0).toFixed(1)}%</td>
                <td>${Number(quote.shippingCost || 0).toFixed(2)}</td>
                <td>${Number(quote.delayPenalty || 0).toFixed(2)}</td>
                <td><strong>${landedCost(quote).toFixed(2)}</strong></td>
                <td>${Number(quote.leadTimeDays || 0)} days</td>
                <td>${(latestScore(quote.vendorId)?.overallScore || 0).toFixed(1)}</td>
                <td>${escapeHtml(quote.finalDecision || "-")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function bindCatalogueForm() {
  on("catalogueForm", "submit", async (event) => {
    event.preventDefault();
    const file = document.getElementById("catalogueFile").files[0];
    let driveFile = null;
    if (file && accessToken) {
      driveFile = await uploadDriveFile(file.name, file.type || "application/octet-stream", file);
    }
    const item = {
      id: uid(),
      vendorId: value("catalogueVendor"),
      title: value("catalogueTitle"),
      catalogueUrl: value("catalogueUrl"),
      localFileUri: driveFile?.webViewLink || "",
      localFileName: file?.name || "",
      driveFileId: driveFile?.id || "",
      fileType: file?.type || "",
      downloadedAt: "",
      linkStatus: "Unknown",
      notes: value("catalogueNotes")
    };
    db.catalogues.push(item);
    audit("Created", "Catalogue", item.title);
    saveLocal();
    event.target.reset();
    renderAll();
  });
}

function renderCatalogues() {
  const list = document.getElementById("catalogueList");
  if (!list) return;
  list.innerHTML = db.catalogues.length ? "" : emptyHtml();
  db.catalogues.forEach((item) => {
    list.appendChild(card(`
      <div class="card-header">
        <div><div class="card-title">${escapeHtml(item.title)}</div><div class="muted">${escapeHtml(vendorName(item.vendorId))}</div></div>
        <div class="chips">${chip(item.linkStatus || "Unknown")}</div>
      </div>
      <div>${item.catalogueUrl ? `<a href="${escapeAttr(normalizeUrl(item.catalogueUrl))}" target="_blank" rel="noreferrer">Catalogue URL</a>` : ""}</div>
      <div>${item.localFileUri ? `<a href="${escapeAttr(item.localFileUri)}" target="_blank" rel="noreferrer">Drive attachment</a>` : escapeHtml(item.localFileName || "")}</div>
      <div class="muted">${escapeHtml(item.notes || "")}</div>
      <div class="form-actions"><button data-check-catalogue="${item.id}">Check link</button></div>
    `));
  });
  list.querySelectorAll("[data-check-catalogue]").forEach((button) => {
    button.addEventListener("click", () => checkCatalogueLink(button.dataset.checkCatalogue));
  });
}

async function checkCatalogueLink(id) {
  const item = db.catalogues.find((catalogue) => catalogue.id === id);
  if (!item?.catalogueUrl) return showAlert("No catalogue URL saved.", "error");
  item.linkStatus = await checkUrlStatus(item.catalogueUrl);
  saveLocal();
  renderCatalogues();
}

function bindDocumentForm() {
  on("documentForm", "submit", async (event) => {
    event.preventDefault();
    const file = document.getElementById("documentFile").files[0];
    let driveFile = null;
    if (file && accessToken) {
      driveFile = await uploadDriveFile(file.name, file.type || "application/octet-stream", file);
    }
    const item = {
      id: uid(),
      vendorId: value("documentVendor"),
      type: value("documentType"),
      title: value("documentTitle"),
      documentUrl: value("documentUrl"),
      localFileUri: driveFile?.webViewLink || "",
      localFileName: file?.name || "",
      fileType: file?.type || "",
      driveFileId: driveFile?.id || "",
      uploadedAt: todayIso(),
      validUntil: value("documentValidUntil"),
      linkStatus: "Unknown",
      notes: value("documentNotes")
    };
    if (!item.vendorId || !item.title) return showAlert("Vendor and document title are required.", "error");
    db.documents.push(item);
    audit("Created", "Document", item.title);
    saveLocal();
    event.target.reset();
    renderAll();
  });
}

function renderDocuments() {
  const list = document.getElementById("documentList");
  if (!list) return;
  list.innerHTML = db.documents.length ? "" : emptyHtml();
  db.documents.slice().reverse().forEach((item) => {
    const days = item.validUntil ? dateDiffDays(todayIso(), item.validUntil) : null;
    list.appendChild(card(`
      <div class="card-header">
        <div><div class="card-title">${escapeHtml(item.title)}</div><div class="muted">${escapeHtml(item.type)} &middot; ${escapeHtml(vendorName(item.vendorId))}</div></div>
        <div class="chips">${chip(item.linkStatus || "Unknown")}${days !== null && days < 31 ? chip(days < 0 ? "Expired" : `Due ${days}d`) : ""}</div>
      </div>
      <div>${item.documentUrl ? `<a href="${escapeAttr(normalizeUrl(item.documentUrl))}" target="_blank" rel="noreferrer">Public URL</a>` : ""}</div>
      <div>${item.localFileUri ? `<a href="${escapeAttr(item.localFileUri)}" target="_blank" rel="noreferrer">Drive attachment</a>` : escapeHtml(item.localFileName || "")}</div>
      <div class="muted">Valid until ${escapeHtml(item.validUntil || "-")}</div>
      <div class="form-actions"><button data-check-document="${item.id}">Check URL</button></div>
    `));
  });
  list.querySelectorAll("[data-check-document]").forEach((button) => {
    button.addEventListener("click", () => checkDocumentLink(button.dataset.checkDocument));
  });
}

async function checkDocumentLink(id) {
  const item = db.documents.find((documentItem) => documentItem.id === id);
  if (!item?.documentUrl) return showAlert("No document URL saved.", "error");
  item.linkStatus = await checkUrlStatus(item.documentUrl);
  saveLocal();
  renderDocuments();
}

function bindQuotationForm() {
  on("quotationForm", "submit", async (event) => {
    event.preventDefault();
    const file = document.getElementById("quotationFile").files[0];
    let driveFile = null;
    if (file && accessToken) {
      driveFile = await uploadDriveFile(file.name, file.type || "application/octet-stream", file);
    }
    const quote = normalizeQuotation({
      id: uid(),
      rfqId: value("quotationRfq"),
      vendorId: value("quotationVendor"),
      itemName: value("itemName"),
      specification: value("specification"),
      quantity: numberValue("quantity"),
      quotedPrice: numberValue("quotedPrice"),
      currency: value("currency") || "INR",
      leadTimeDays: numberValue("leadTimeDays"),
      gstPercent: numberValue("gstPercent"),
      shippingCost: numberValue("shippingCost"),
      delayPenalty: numberValue("delayPenalty"),
      warranty: value("warranty"),
      paymentTerms: value("quotationPaymentTerms"),
      finalDecision: value("finalDecision"),
      quotationDate: todayIso(),
      validityDate: value("validityDate"),
      quotationFileUri: driveFile?.webViewLink || "",
      quotationFileName: file?.name || "",
      driveFileId: driveFile?.id || "",
      remarks: value("quotationRemarks")
    });
    if (!quote.vendorId || !quote.itemName) return showAlert("Vendor and item name are required.", "error");
    db.quotations.push(quote);
    advanceVendorLifecycle(quote.vendorId, "Quotation Received");
    if (quote.rfqId) updateRfqStatus(quote.rfqId, "Quotation Received");
    audit("Created", "Quotation", `${quote.itemName} - ${vendorName(quote.vendorId)}`);
    saveLocal();
    event.target.reset();
    document.getElementById("quantity").value = "1";
    document.getElementById("currency").value = "INR";
    document.getElementById("gstPercent").value = "18";
    document.getElementById("shippingCost").value = "0";
    document.getElementById("delayPenalty").value = "0";
    renderAll();
  });
}

function renderQuotations() {
  const list = document.getElementById("quotationList");
  if (!list) return;
  list.innerHTML = db.quotations.length ? "" : emptyHtml();
  db.quotations.slice().reverse().forEach((item) => {
    const days = item.validityDate ? dateDiffDays(todayIso(), item.validityDate) : null;
    list.appendChild(card(`
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(item.itemName)}</div>
          <div class="muted">${escapeHtml(vendorName(item.vendorId))}${item.rfqId ? ` &middot; RFQ: ${escapeHtml(rfqTitle(item.rfqId))}` : ""}</div>
        </div>
        <div class="chips">${days !== null && days < 8 ? chip(days < 0 ? "Expired" : `Valid ${days}d`) : ""}${chip(`Lead ${Number(item.leadTimeDays || 0)}d`)}</div>
      </div>
      <div>${escapeHtml(item.specification || "")}</div>
      <div>${escapeHtml(item.currency)} ${Number(item.quotedPrice || 0).toFixed(2)} &middot; landed ${landedCost(item).toFixed(2)} &middot; Qty ${item.quantity || 0}</div>
      <div class="muted">GST ${Number(item.gstPercent || 0)}% &middot; Shipping ${Number(item.shippingCost || 0).toFixed(2)} &middot; Warranty ${escapeHtml(item.warranty || "-")}</div>
      <div class="muted">Date ${escapeHtml(item.quotationDate || "")} &middot; Validity ${escapeHtml(item.validityDate || "-")} &middot; Decision ${escapeHtml(item.finalDecision || "-")}</div>
      <div>${item.quotationFileUri ? `<a href="${escapeAttr(item.quotationFileUri)}" target="_blank" rel="noreferrer">Quotation file</a>` : escapeHtml(item.quotationFileName || "")}</div>
    `));
  });
}

function bindInteractionForm() {
  on("interactionForm", "submit", (event) => {
    event.preventDefault();
    const item = {
      id: uid(),
      vendorId: value("interactionVendor"),
      date: todayIso(),
      mode: value("interactionMode"),
      summary: value("interactionSummary"),
      nextAction: value("nextAction"),
      followupDate: value("followupDate"),
      status: value("interactionStatus")
    };
    db.interactions.push(item);
    if (item.mode === "Quotation") advanceVendorLifecycle(item.vendorId, "RFQ Sent");
    audit("Created", "Interaction", `${item.mode} - ${vendorName(item.vendorId)}`);
    saveLocal();
    event.target.reset();
    renderAll();
  });
}

function renderInteractions() {
  const list = document.getElementById("interactionList");
  if (!list) return;
  list.innerHTML = db.interactions.length ? "" : emptyHtml();
  db.interactions.slice().reverse().forEach((item) => {
    list.appendChild(card(`
      <div class="card-header">
        <div><div class="card-title">${escapeHtml(item.mode)} &middot; ${escapeHtml(vendorName(item.vendorId))}</div><div class="muted">${escapeHtml(item.date || "")}</div></div>
        <div class="chips">${chip(item.status)}</div>
      </div>
      <div>${escapeHtml(item.summary || "")}</div>
      <div class="muted">Next: ${escapeHtml(item.nextAction || "-")} &middot; Follow-up: ${escapeHtml(item.followupDate || "-")}</div>
      ${item.status !== "Closed" ? `<button data-close-interaction="${item.id}">Mark closed</button>` : ""}
    `));
  });
  list.querySelectorAll("[data-close-interaction]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = db.interactions.find((interaction) => interaction.id === button.dataset.closeInteraction);
      if (item) item.status = "Closed";
      audit("Closed", "Interaction", vendorName(item?.vendorId));
      saveLocal();
      renderAll();
    });
  });
}

function bindReminderForm() {
  on("reminderForm", "submit", (event) => {
    event.preventDefault();
    const reminder = {
      id: uid(),
      vendorId: value("reminderVendor"),
      title: value("reminderTitle"),
      dueDate: value("reminderDueDate"),
      priority: value("reminderPriority"),
      status: value("reminderStatus"),
      notes: value("reminderNotes"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!reminder.title || !reminder.dueDate) return showAlert("Reminder title and due date are required.", "error");
    db.reminders.push(reminder);
    audit("Created", "Reminder", reminder.title);
    saveLocal();
    event.target.reset();
    renderAll();
  });
}

function renderReminders() {
  const list = document.getElementById("reminderList");
  if (!list) return;
  const sorted = db.reminders.slice().sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  list.innerHTML = sorted.length ? "" : emptyHtml();
  sorted.forEach((item) => {
    const due = dateDiffDays(todayIso(), item.dueDate);
    list.appendChild(card(`
      <div class="card-header">
        <div><div class="card-title">${escapeHtml(item.title)}</div><div class="muted">${escapeHtml(vendorName(item.vendorId))}</div></div>
        <div class="chips">${chip(item.priority)}${chip(item.status)}${chip(due < 0 ? "Overdue" : `Due ${due}d`)}</div>
      </div>
      <div>${escapeHtml(item.notes || "")}</div>
      <div class="muted">Due ${escapeHtml(item.dueDate)}</div>
      ${item.status !== "Done" ? `<button data-done-reminder="${item.id}">Mark done</button>` : ""}
    `));
  });
  list.querySelectorAll("[data-done-reminder]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = db.reminders.find((reminder) => reminder.id === button.dataset.doneReminder);
      if (item) {
        item.status = "Done";
        item.updatedAt = new Date().toISOString();
        audit("Completed", "Reminder", item.title);
      }
      saveLocal();
      renderAll();
    });
  });
}

function bindScoreForm() {
  on("scoreInputs", "input", updateOverallScore);
  on("scoreVendor", "change", renderScoreForm);
  on("scoreForm", "submit", (event) => {
    event.preventDefault();
    const score = scoreInputValues("scoreInputs");
    const item = {
      id: uid(),
      vendorId: value("scoreVendor"),
      ...score,
      overallScore: calculateOverall(score),
      comments: value("scoreComments"),
      updatedAt: new Date().toISOString()
    };
    db.scores.push(item);
    advanceVendorLifecycle(item.vendorId, "Rated");
    audit("Updated", "Vendor Score", vendorName(item.vendorId));
    saveLocal();
    renderAll();
  });
}

function renderScoreInputs(containerId, weights, weightMode = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  Object.entries(scoreLabels).forEach(([key, label]) => {
    const wrapper = document.createElement("label");
    wrapper.textContent = weightMode ? `${label} Weight` : label;
    const input = document.createElement("input");
    input.type = "number";
    input.step = weightMode ? "0.01" : "0.5";
    input.min = "0";
    input.max = weightMode ? "1" : "10";
    input.dataset.scoreKey = key;
    input.value = weightMode ? weights[key] : "0";
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });
}

function renderScoreForm() {
  const latest = latestScore(value("scoreVendor"));
  document.querySelectorAll("#scoreInputs [data-score-key]").forEach((input) => {
    input.value = latest?.[input.dataset.scoreKey] || 0;
  });
  const comments = document.getElementById("scoreComments");
  if (comments) comments.value = latest?.comments || "";
  updateOverallScore();
}

function scoreInputValues(containerId) {
  const values = {};
  document.querySelectorAll(`#${containerId} [data-score-key]`).forEach((input) => {
    values[input.dataset.scoreKey] = Number(input.value || 0);
  });
  return values;
}

function updateOverallScore() {
  const output = document.getElementById("overallScore");
  if (output) output.textContent = calculateOverall(scoreInputValues("scoreInputs")).toFixed(2);
}

function calculateOverall(score) {
  const weights = db.settings.weights;
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
  return Object.keys(scoreLabels).reduce((sum, key) => {
    return sum + Number(score[key] || 0) * (Number(weights[key] || 0) / totalWeight);
  }, 0);
}

function latestScore(vendorId) {
  return db.scores
    .filter((score) => score.vendorId === vendorId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
}

function bindImportExport() {
  on("exportJsonBtn", "click", () => downloadText("vendor-manager-backup.json", JSON.stringify(db, null, 2), "application/json"));
  on("exportVendorCsvBtn", "click", () => downloadText("vendors.csv", vendorsToCsv()));
  on("exportQuotationCsvBtn", "click", () => downloadText("quotations.csv", quotationsToCsv()));
  on("exportRfqCsvBtn", "click", () => downloadText("rfqs.csv", rfqsToCsv()));
  on("exportReminderCsvBtn", "click", () => downloadText("reminders.csv", remindersToCsv()));
  on("exportMarkdownBtn", "click", () => downloadText("category-vendors.md", categoryMarkdown(), "text/markdown"));
  on("importCsvBtn", "click", importVendorCsv);
  on("importJsonBtn", "click", importJsonBackup);
}

async function importVendorCsv() {
  const file = document.getElementById("importVendorCsv").files[0];
  if (!file) return showAlert("Choose a CSV file first.", "error");
  const rows = parseCsv(await file.text()).filter((row) => row.some((cell) => String(cell).trim()));
  if (!rows.length) return showAlert("CSV file is empty.", "error");
  const headers = rows.shift().map(normalizeHeader);
  const vendors = rows.map((row) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
    return normalizeVendor({
      ...record,
      companyName: record.companyName || record.company || "Imported Vendor",
      vendorType: record.vendorType || "Supplier",
      category: record.category || "Custom Fabrication",
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  db.vendors.push(...vendors);
  audit("Imported", "Vendors CSV", `${vendors.length} vendors`);
  saveLocal();
  renderAll();
  showAlert(`Imported ${vendors.length} vendors.`, "success");
}

async function importJsonBackup() {
  const file = document.getElementById("importJsonFile").files[0];
  if (!file) return showAlert("Choose a JSON backup first.", "error");
  db = normalizeDb(JSON.parse(await file.text()));
  audit("Imported", "JSON Backup", file.name);
  saveLocal();
  populateStaticOptions();
  renderAll();
  showAlert("JSON backup imported.", "success");
}

function vendorsToCsv() {
  const columns = ["companyName", "vendorType", "category", "subCategory", "tags", "productsServices", "brandsSupplied", "city", "area", "phone", "whatsapp", "email", "website", "gstNumber", "contactPerson", "contactRole", "typicalLeadTimeDays", "moq", "paymentTerms", "technicalCapabilities", "verificationStatus", "lifecycleStatus", "notes"];
  return toCsv(columns, db.vendors);
}

function quotationsToCsv() {
  const columns = ["rfqId", "vendorId", "itemName", "specification", "quantity", "quotedPrice", "currency", "leadTimeDays", "gstPercent", "shippingCost", "delayPenalty", "warranty", "paymentTerms", "finalDecision", "quotationDate", "validityDate", "remarks"];
  return toCsv(columns, db.quotations);
}

function rfqsToCsv() {
  const columns = ["title", "category", "itemDescription", "vendorIds", "status", "dueDate", "remarks", "createdAt"];
  return toCsv(columns, db.rfqs.map((rfq) => ({ ...rfq, vendorIds: (rfq.vendorIds || []).map(vendorName).join("; ") })));
}

function remindersToCsv() {
  const columns = ["vendorId", "title", "dueDate", "priority", "status", "notes"];
  return toCsv(columns, db.reminders);
}

function categoryMarkdown() {
  const rows = db.vendors
    .slice()
    .sort((a, b) => `${a.category}${a.companyName}`.localeCompare(`${b.category}${b.companyName}`))
    .map((vendor) => `| ${md(vendor.category)} | ${md(vendor.companyName)} | ${md(vendor.vendorType)} | ${md(vendor.area)} | ${md(vendor.tags)} | ${md(vendor.phone)} | ${md(vendor.email)} | ${md((latestScore(vendor.id)?.overallScore || 0).toFixed(1))} | ${md(vendor.lifecycleStatus)} |`);
  return ["# Category-wise Vendor List", "", "| Category | Company | Type | Area | Tags | Phone | Email | Score | Lifecycle |", "| --- | --- | --- | --- | --- | --- | --- | ---: | --- |", ...rows].join("\n");
}

function bindDrive() {
  document.getElementById("googleClientId").value = localStorage.getItem(CLIENT_ID_KEY) || "";
  document.getElementById("driveFileId").value = localStorage.getItem(DRIVE_FILE_ID_KEY) || db.meta.driveFileId || "";
  on("saveClientIdBtn", "click", () => {
    localStorage.setItem(CLIENT_ID_KEY, value("googleClientId"));
    showAlert("Client ID saved locally.", "success");
  });
  ["authorizeDriveBtn", "driveAuthBtn"].forEach((id) => on(id, "click", authorizeDrive));
  ["saveDriveBtn", "saveDriveFileBtn"].forEach((id) => on(id, "click", saveToDrive));
  ["loadDriveBtn", "loadDriveFileBtn"].forEach((id) => on(id, "click", loadFromDrive));
  on("createDriveFileBtn", "click", createDriveDatabase);
  on("listDriveFilesBtn", "click", listDriveFiles);
  on("shareDriveBtn", "click", shareDriveFile);
}

function initTokenClient() {
  const clientId = value("googleClientId") || localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) throw new Error("Add your Google OAuth Client ID first.");
  if (!window.google?.accounts?.oauth2) throw new Error("Google Identity Services has not loaded yet.");
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: (response) => {
      accessToken = response.access_token;
      renderDriveState();
      showAlert("Google Drive connected.", "success");
    }
  });
}

function authorizeDrive() {
  try {
    initTokenClient();
    tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
  } catch (error) {
    showAlert(error.message, "error");
  }
}

function requireToken() {
  if (!accessToken) throw new Error("Connect Google Drive first.");
}

async function createDriveDatabase() {
  try {
    requireToken();
    const file = await uploadDriveFile(DRIVE_FILE_NAME, "application/json", new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }));
    rememberDriveFile(file.id);
    audit("Created", "Drive Database", file.id);
    saveLocal();
    showAlert("Drive database created.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function saveToDrive() {
  try {
    requireToken();
    const fileId = value("driveFileId") || db.meta.driveFileId;
    if (!fileId) return createDriveDatabase();
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(db, null, 2)
    });
    if (!response.ok) throw new Error(await response.text());
    rememberDriveFile(fileId);
    audit("Saved", "Google Drive", fileId);
    saveLocal();
    showAlert("Saved to Google Drive.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function loadFromDrive() {
  try {
    requireToken();
    const fileId = value("driveFileId") || db.meta.driveFileId;
    if (!fileId) throw new Error("Enter a Drive File ID first.");
    const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`);
    db = normalizeDb(await response.json());
    rememberDriveFile(fileId);
    audit("Loaded", "Google Drive", fileId);
    saveLocal();
    populateStaticOptions();
    renderAll();
    showAlert("Loaded database from Google Drive.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function listDriveFiles() {
  try {
    requireToken();
    const query = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
    const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)`);
    const data = await response.json();
    const container = document.getElementById("driveFiles");
    container.innerHTML = data.files?.length ? "" : emptyHtml();
    (data.files || []).forEach((file) => {
      container.appendChild(card(`
        <div class="card-title">${escapeHtml(file.name)}</div>
        <div class="muted">${escapeHtml(file.modifiedTime || "")}</div>
        <div><code>${escapeHtml(file.id)}</code></div>
        <button data-use-drive-id="${file.id}">Use this file</button>
      `));
    });
    container.querySelectorAll("[data-use-drive-id]").forEach((button) => {
      button.addEventListener("click", () => rememberDriveFile(button.dataset.useDriveId));
    });
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function shareDriveFile() {
  try {
    requireToken();
    const fileId = value("driveFileId") || db.meta.driveFileId;
    const emailAddress = value("shareEmail");
    const role = value("shareRole") || "reader";
    if (!fileId) throw new Error("Enter or create a Drive File ID first.");
    if (!emailAddress) throw new Error("Enter your friend's email address.");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?sendNotificationEmail=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type: "user", role, emailAddress })
    });
    if (!response.ok) throw new Error(await response.text());
    audit("Shared", "Google Drive", `${fileId} with ${emailAddress}`);
    saveLocal();
    showAlert("Drive file shared.", "success");
  } catch (error) {
    showAlert(error.message, "error");
  }
}

async function uploadDriveFile(name, mimeType, blob) {
  requireToken();
  const boundary = "vendor_manager_boundary_" + Date.now();
  const metadata = { name, mimeType };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`
  ], { type: `multipart/related; boundary=${boundary}` });
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function driveFetch(url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(await response.text());
  return response;
}

function rememberDriveFile(fileId) {
  db.meta.driveFileId = fileId;
  document.getElementById("driveFileId").value = fileId;
  localStorage.setItem(DRIVE_FILE_ID_KEY, fileId);
  saveLocal();
  renderDriveState();
}

function renderDriveState() {
  const status = document.getElementById("driveStatus");
  if (!status) return;
  const fileId = value("driveFileId") || localStorage.getItem(DRIVE_FILE_ID_KEY) || "";
  status.textContent = accessToken
    ? `Connected. ${fileId ? "Current file: " + fileId : "No database file selected."}`
    : "Not connected.";
}

function bindSettings() {
  on("settingsForm", "submit", (event) => {
    event.preventDefault();
    db.settings.categories = lines("settingsCategories");
    db.settings.vendorTypes = lines("settingsVendorTypes");
    db.settings.verificationStatuses = lines("settingsVerificationStatuses");
    db.settings.lifecycleStatuses = lines("settingsLifecycleStatuses");
    db.settings.rfqStatuses = lines("settingsRfqStatuses");
    db.settings.documentTypes = lines("settingsDocumentTypes");
    db.settings.weights = scoreInputValues("settingsWeights");
    audit("Updated", "Settings", "Configuration");
    saveLocal();
    populateStaticOptions();
    renderAll();
    showAlert("Settings saved.", "success");
  });
}

function renderSettings() {
  setValue("settingsCategories", db.settings.categories.join("\n"));
  setValue("settingsVendorTypes", db.settings.vendorTypes.join("\n"));
  setValue("settingsVerificationStatuses", db.settings.verificationStatuses.join("\n"));
  setValue("settingsLifecycleStatuses", db.settings.lifecycleStatuses.join("\n"));
  setValue("settingsRfqStatuses", db.settings.rfqStatuses.join("\n"));
  setValue("settingsDocumentTypes", db.settings.documentTypes.join("\n"));
  document.querySelectorAll("#settingsWeights [data-score-key]").forEach((input) => {
    input.value = db.settings.weights[input.dataset.scoreKey] || 0;
  });
  renderAudit();
}

function renderDashboard() {
  const dueLimit = addDays(new Date(), 7).toISOString().slice(0, 10);
  const expiringQuotes = db.quotations.filter((q) => q.validityDate && q.validityDate <= dueLimit).length;
  const staleVendors = db.vendors.filter((vendor) => {
    const last = latestInteractionDate(vendor.id) || vendor.updatedAt || vendor.createdAt;
    return dateDiffDays(String(last).slice(0, 10), todayIso()) > 180;
  }).length;
  const metrics = [
    ["Total vendors", db.vendors.length],
    ["Preferred", db.vendors.filter((v) => v.lifecycleStatus === "Preferred").length],
    ["Verified", db.vendors.filter((v) => v.verificationStatus === "Verified").length],
    ["Pending RFQs", db.rfqs.filter((r) => !["Closed", "Delivered"].includes(r.status)).length],
    ["Quotes expiring", expiringQuotes],
    ["No contact 6 mo", staleVendors],
    ["Documents", db.documents.length + db.catalogues.length],
    ["Reminders", db.reminders.filter((r) => r.status !== "Done").length]
  ];
  document.getElementById("dashboardMetrics").innerHTML = metrics.map(([label, count]) => `<div class="metric"><span>${label}</span><strong>${count}</strong></div>`).join("");
  const top = db.vendors
    .map((vendor) => ({ vendor, score: latestScore(vendor.id)?.overallScore || 0 }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  document.getElementById("topVendors").innerHTML = top.length ? top.map((item) => `<div class="card"><div class="card-title">${escapeHtml(item.vendor.companyName)}</div><div>${escapeHtml(item.vendor.category)} &middot; ${item.score.toFixed(2)}</div></div>`).join("") : emptyHtml();
  const dueWork = [
    ...db.interactions.filter((i) => i.followupDate && i.followupDate <= dueLimit && i.status !== "Closed").map((i) => ({ title: vendorName(i.vendorId), body: i.summary, date: i.followupDate })),
    ...db.reminders.filter((r) => r.dueDate && r.dueDate <= dueLimit && r.status !== "Done").map((r) => ({ title: r.title, body: vendorName(r.vendorId), date: r.dueDate })),
    ...db.quotations.filter((q) => q.validityDate && q.validityDate <= dueLimit).map((q) => ({ title: `Quote expires: ${q.itemName}`, body: vendorName(q.vendorId), date: q.validityDate }))
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  document.getElementById("dueWork").innerHTML = dueWork.length ? dueWork.map((item) => `<div class="card"><div class="card-title">${escapeHtml(item.title)}</div><div>${escapeHtml(item.body || "")}</div><div class="muted">${escapeHtml(item.date)}</div></div>`).join("") : emptyHtml();
  document.getElementById("categoryBars").innerHTML = barList(groupCounts(db.vendors, "category"));
  renderSignals();
}

function renderSignals() {
  const topCategory = topGroup(groupCounts(db.vendors, "category"));
  const avgLead = average(db.quotations.map((q) => Number(q.leadTimeDays || 0)).filter(Boolean));
  const preferredScore = average(db.vendors.filter((v) => v.lifecycleStatus === "Preferred").map((v) => latestScore(v.id)?.overallScore || 0).filter(Boolean));
  document.getElementById("procurementSignals").innerHTML = [
    ["Top category", topCategory?.label || "-"],
    ["Avg quote lead", avgLead ? `${avgLead.toFixed(1)} days` : "-"],
    ["Preferred avg score", preferredScore ? preferredScore.toFixed(2) : "-"],
    ["Drive file", db.meta.driveFileId ? "Configured" : "Local only"]
  ].map(([label, valueText]) => `<div class="signal"><span>${escapeHtml(label)}</span><strong>${escapeHtml(valueText)}</strong></div>`).join("");
}

function renderAnalytics() {
  const container = document.getElementById("analyticsPanels");
  if (!container) return;
  const quotesByMonth = groupBy(db.quotations, (quote) => String(quote.quotationDate || "").slice(0, 7) || "Unknown");
  const avgLeadByCategory = Object.fromEntries(db.settings.categories.map((category) => {
    const categoryQuotes = db.quotations.filter((quote) => db.vendors.find((vendor) => vendor.id === quote.vendorId)?.category === category);
    return [category, average(categoryQuotes.map((quote) => Number(quote.leadTimeDays || 0)).filter(Boolean))];
  }).filter((entry) => entry[1]));
  const scoreData = Object.fromEntries(db.vendors.map((vendor) => [vendor.companyName, latestScore(vendor.id)?.overallScore || 0]).filter((entry) => entry[1]).sort((a, b) => b[1] - a[1]).slice(0, 8));
  container.innerHTML = [
    panelHtml("Vendors by Category", barList(groupCounts(db.vendors, "category"))),
    panelHtml("Vendors by City", barList(groupCounts(db.vendors, "city"))),
    panelHtml("Quotations per Month", barList(quotesByMonth)),
    panelHtml("Average Lead Time by Category", barList(avgLeadByCategory, "days")),
    panelHtml("Vendor Score Comparison", barList(scoreData, "score")),
    panelHtml("Pending Follow-ups", barList({
      Interactions: db.interactions.filter((item) => item.status !== "Closed").length,
      Reminders: db.reminders.filter((item) => item.status !== "Done").length,
      ExpiringQuotes: db.quotations.filter((item) => item.validityDate && dateDiffDays(todayIso(), item.validityDate) <= 7).length
    }))
  ].join("");
}

function panelHtml(title, innerHtml) {
  return `<article class="panel"><h3>${escapeHtml(title)}</h3>${innerHtml || emptyHtml()}</article>`;
}

function renderAudit() {
  const list = document.getElementById("auditList");
  if (!list) return;
  const rows = db.auditLog.slice(0, 25);
  list.innerHTML = rows.length ? rows.map((item) => `
    <div class="card">
      <div class="card-title">${escapeHtml(item.action)} ${escapeHtml(item.entity)}</div>
      <div>${escapeHtml(item.label || "")}</div>
      <div class="muted">${escapeHtml(item.at || "")}</div>
    </div>
  `).join("") : emptyHtml();
}

function detectDuplicates(candidate) {
  return db.vendors
    .filter((vendor) => vendor.id !== candidate.id)
    .map((vendor) => {
      const reasons = [];
      if (candidate.phone && eq(candidate.phone, vendor.phone)) reasons.push("same phone");
      if (candidate.email && eq(candidate.email, vendor.email)) reasons.push("same email");
      if (candidate.gstNumber && eq(candidate.gstNumber, vendor.gstNumber)) reasons.push("same GST");
      if (domain(candidate.website) && domain(candidate.website) === domain(vendor.website)) reasons.push("same website domain");
      if (similarity(candidate.companyName, vendor.companyName) >= 0.86) reasons.push("similar company name");
      return reasons.length ? `${vendor.companyName}: ${reasons.join(", ")}` : "";
    })
    .filter(Boolean);
}

function showDuplicateWarning(duplicates) {
  const element = document.getElementById("duplicateWarning");
  element.textContent = `Possible duplicate vendor found: ${duplicates.join("; ")}`;
  element.classList.remove("hidden");
}

async function checkUrlStatus(url) {
  try {
    let response = await fetch(normalizeUrl(url), { method: "HEAD", mode: "cors", cache: "no-store" });
    if (!response.ok && response.status === 405) {
      response = await fetch(normalizeUrl(url), { method: "GET", mode: "cors", cache: "no-store" });
    }
    return response.ok ? "Working" : "Broken";
  } catch {
    showAlert("Browser CORS blocked this link check. Open the URL manually or use the Python/Android checker for strict verification.", "error");
    return "Unknown";
  }
}

function landedCost(quote) {
  const base = Number(quote.quotedPrice || 0) * Number(quote.quantity || 1);
  const gst = base * (Number(quote.gstPercent || 0) / 100);
  return base + gst + Number(quote.shippingCost || 0) + Number(quote.delayPenalty || 0);
}

function linkedRecordCount(vendorId) {
  return [
    db.catalogues,
    db.documents,
    db.quotations,
    db.interactions,
    db.reminders,
    db.scores
  ].reduce((count, rows) => count + rows.filter((item) => item.vendorId === vendorId).length, 0);
}

function advanceVendorLifecycle(vendorId, targetStatus) {
  const vendor = db.vendors.find((item) => item.id === vendorId);
  if (!vendor) return;
  const currentIndex = db.settings.lifecycleStatuses.indexOf(vendor.lifecycleStatus);
  const targetIndex = db.settings.lifecycleStatuses.indexOf(targetStatus);
  if (targetIndex >= 0 && targetIndex > currentIndex) {
    vendor.lifecycleStatus = targetStatus;
    vendor.updatedAt = new Date().toISOString();
  }
}

function updateRfqStatus(rfqId, targetStatus) {
  const rfq = db.rfqs.find((item) => item.id === rfqId);
  if (!rfq) return;
  const currentIndex = db.settings.rfqStatuses.indexOf(rfq.status);
  const targetIndex = db.settings.rfqStatuses.indexOf(targetStatus);
  if (targetIndex >= 0 && targetIndex > currentIndex) {
    rfq.status = targetStatus;
    rfq.updatedAt = new Date().toISOString();
  }
}

function audit(action, entity, label, details = "") {
  db.auditLog.unshift({
    id: uid(),
    action,
    entity,
    label,
    details,
    at: new Date().toISOString()
  });
  db.auditLog = db.auditLog.slice(0, 250);
}

function value(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function setValue(id, newValue) {
  const element = document.getElementById(id);
  if (element) element.value = newValue;
}

function numberValue(id) {
  return Number(value(id) || 0);
}

function selectedValues(id) {
  const element = document.getElementById(id);
  return element ? [...element.selectedOptions].map((option) => option.value) : [];
}

function lines(id) {
  return value(id).split("\n").map((item) => item.trim()).filter(Boolean);
}

function on(id, eventName, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener(eventName, handler);
}

function vendorName(id) {
  return db.vendors.find((vendor) => vendor.id === id)?.companyName || "Unknown vendor";
}

function rfqTitle(id) {
  return db.rfqs.find((rfq) => rfq.id === id)?.title || "Unknown RFQ";
}

function card(html) {
  const div = document.createElement("article");
  div.className = "card";
  div.innerHTML = html;
  return div;
}

function chip(text) {
  const cls = String(text).split(" ")[0].replace(/[^a-z0-9_-]/gi, "");
  return `<span class="chip ${escapeAttr(cls)}">${escapeHtml(text)}</span>`;
}

function emptyHtml() {
  return document.getElementById("emptyTemplate").innerHTML;
}

function showAlert(message, type = "") {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert ${type}`;
  alert.classList.remove("hidden");
  clearTimeout(showAlert.timer);
  showAlert.timer = setTimeout(() => alert.classList.add("hidden"), 4500);
}

function toCsv(columns, rows) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => {
    const valueText = Array.isArray(row[column]) ? row[column].join("; ") : row[column] ?? "";
    return csv(valueText);
  }).join(","))].join("\n");
}

function csv(valueText) {
  const text = String(valueText);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(header) {
  const compact = header.toLowerCase().replace(/[\s_]/g, "");
  const map = {
    company: "companyName",
    companyname: "companyName",
    vendor: "companyName",
    vendorname: "companyName",
    vendortype: "vendorType",
    productservices: "productsServices",
    productsservices: "productsServices",
    address: "fullAddress",
    fulladdress: "fullAddress",
    gst: "gstNumber",
    gstnumber: "gstNumber",
    contact: "contactPerson",
    contactperson: "contactPerson",
    leadtime: "typicalLeadTimeDays",
    typicalleadtime: "typicalLeadTimeDays",
    lifecycle: "lifecycleStatus",
    status: "verificationStatus"
  };
  return map[compact] || header;
}

function downloadText(filename, text, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(valueText) {
  return String(valueText ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function escapeAttr(valueText) {
  return escapeHtml(valueText).replace(/`/g, "&#096;");
}

function md(valueText) {
  return String(valueText ?? "").replaceAll("\n", " ").replaceAll("|", "\\|");
}

function slugify(valueText) {
  return String(valueText).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeUrl(url) {
  if (!url) return "";
  return url.includes("://") ? url : `https://${url}`;
}

function isValidUrl(url) {
  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}

function eq(a, b) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function domain(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function similarity(a, b) {
  a = String(a || "").toLowerCase().trim();
  b = String(b || "").toLowerCase().trim();
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 1;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshtein(a, b) {
  const costs = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = i - 1;
    costs[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = costs[j];
      costs[j] = Math.min(costs[j] + 1, costs[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return costs[b.length];
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dateDiffDays(fromIso, toIso) {
  const from = new Date(fromIso + "T00:00:00");
  const to = new Date(toIso + "T00:00:00");
  return Math.round((to - from) / 86400000);
}

function latestInteractionDate(vendorId) {
  return db.interactions
    .filter((item) => item.vendorId === vendorId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0]?.date;
}

function groupCounts(rows, key) {
  return rows.reduce((acc, row) => {
    const label = row[key] || "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function groupBy(rows, getKey) {
  return rows.reduce((acc, row) => {
    const label = getKey(row);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function barList(data, suffix = "") {
  const entries = Object.entries(data)
    .filter((entry) => Number(entry[1]) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 10);
  if (!entries.length) return emptyHtml();
  const max = Math.max(...entries.map((entry) => Number(entry[1])));
  return `<div class="bar-list">${entries.map(([label, count]) => `
    <div class="bar-row">
      <span>${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, (Number(count) / max) * 100)}%"></div></div>
      <strong>${Number(count).toFixed(Number.isInteger(Number(count)) ? 0 : 1)}${suffix ? " " + escapeHtml(suffix) : ""}</strong>
    </div>
  `).join("")}</div>`;
}

function topGroup(grouped) {
  const [label, count] = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0] || [];
  return label ? { label, count } : null;
}

function average(values) {
  return values.length ? values.reduce((sum, valueText) => sum + Number(valueText || 0), 0) / values.length : 0;
}

function nextFromList(list, current) {
  const index = list.indexOf(current);
  return index >= 0 && index < list.length - 1 ? list[index + 1] : "";
}

function tagList(tags) {
  return String(tags || "").toLowerCase().split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function digits(valueText) {
  return String(valueText || "").replace(/\D/g, "");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
