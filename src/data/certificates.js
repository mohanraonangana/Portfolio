// Verified certifications for the public portfolio.
//
// Every field below was read directly from the issued certificate files in
// C:\Users\mohan\Desktop\certificates. Nothing here is invented: fields that
// could not be verified from a file are simply absent (and hidden in the UI).
//
// Preview images are web-optimised copies (generated from those exact files)
// served from public/certificates/ — the original PDFs/images stay on disk and
// are never referenced or shipped. Each card has a "-thumb" (card) and a
// "-full" (modal) version of the same certificate, so the preview always
// matches its own record.

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')

export const certAsset = (name) => (name ? `${BASE}/certificates/${name}` : null)

export const CERTIFICATES = [
  {
    id: 'aws-cloud-practitioner',
    num: '01',
    title: 'AWS Certified Cloud Practitioner',
    subtitle: 'Foundational',
    issuer: 'Amazon Web Services',
    short: 'AWS',
    issued: null,
    valid: null,
    credentialId: null,
    credentialLabel: 'CREDENTIAL ID',
    thumb: 'aws-certified-cloud-practitioner-thumb.png',
    full: 'aws-certified-cloud-practitioner-full.png',
    verify: null,
  },
  {
    id: 'oracle-oci-2025-developer-professional',
    num: '02',
    title: 'Oracle Cloud Infrastructure 2025 Certified Developer Professional',
    subtitle: 'Oracle Certified Professional',
    issuer: 'Oracle',
    short: 'OR',
    issued: 'July 28, 2025',
    valid: 'Valid until July 28, 2027',
    credentialId: '102145460OCID25CP',
    credentialLabel: 'CREDENTIAL ID',
    thumb: 'oracle-cloud-infrastructure-2025-developer-professional-thumb.jpg',
    full: 'oracle-cloud-infrastructure-2025-developer-professional-full.jpg',
    verify: null,
  },
  {
    id: 'aviatrix-ace-multicloud-network-associate',
    num: '03',
    title: 'Aviatrix Certified Engineer — Multicloud Network Associate',
    subtitle: 'ACE Program',
    issuer: 'Aviatrix, Inc.',
    short: 'AV',
    issued: 'January 30, 2025',
    valid: 'Valid through January 30, 2028',
    credentialId: '2025-23418',
    credentialLabel: 'ACE ID',
    thumb: 'aviatrix-ace-multicloud-network-associate-thumb.jpg',
    full: 'aviatrix-ace-multicloud-network-associate-full.jpg',
    verify: null,
  },
  {
    id: 'red-hat-enterprise-application-development',
    num: '04',
    title: 'Red Hat Certified Specialist in Enterprise Application Development',
    subtitle: null,
    issuer: 'Red Hat',
    short: 'RH',
    issued: 'January 07, 2025',
    valid: null,
    credentialId: '240-258-368',
    credentialLabel: 'CERTIFICATION ID',
    thumb: 'red-hat-enterprise-application-development-thumb.jpg',
    full: 'red-hat-enterprise-application-development-full.jpg',
    verify: 'https://www.credly.com/badges/6a94a0ba-8954-427d-9fd6-d08641cae57e',
  },
  {
    id: 'salesforce-ai-associate',
    num: '05',
    title: 'Salesforce Certified AI Associate',
    subtitle: null,
    issuer: 'Salesforce',
    short: 'SF',
    issued: 'October 20, 2024',
    valid: null,
    credentialId: '5088748',
    credentialLabel: 'CREDENTIAL ID',
    thumb: 'salesforce-certified-ai-associate-thumb.jpg',
    full: 'salesforce-certified-ai-associate-full.jpg',
    verify: 'https://sforce.co/verifycerts',
  },
  {
    id: 'wipro-java-full-stack',
    num: '06',
    title: 'Java Full Stack',
    subtitle: 'TalentNext — Digital Skills Readiness Program',
    issuer: 'Wipro Limited',
    short: 'WI',
    issued: 'July – October 2025',
    valid: null,
    credentialId: 'TNext_SE_25_J_250890606',
    credentialLabel: 'CERT ID',
    thumb: 'wipro-java-full-stack-thumb.jpg',
    full: 'wipro-java-full-stack-full.jpg',
    verify: null,
  },
  {
    id: 'aicte-eduskills-ai-ml-virtual-internship',
    num: '07',
    title: 'AI-ML Virtual Internship',
    subtitle: 'Certificate of Virtual Internship',
    issuer: 'AICTE–EduSkills',
    short: 'AI',
    issued: 'January – March 2024',
    valid: null,
    duration: '10 weeks',
    institution: 'K L University',
    supportedBy: 'AWS Academy',
    credentialId: '68acb732baf610424b5bd9488dd529f8',
    credentialLabel: 'CERTIFICATE ID',
    thumb: 'aicte-eduskills-ai-ml-virtual-internship-thumb.jpg',
    full: 'aicte-eduskills-ai-ml-virtual-internship-full.jpg',
    verify: null,
  },
]
