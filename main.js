// Dataset holders (populated from external JSON files when available)
let maleNames = [];
let femaleNames = [];
let lastNames = [];
const suffixes = ["", "", "", "", "", "Jr.", "III"];

// Address & Demographics
const religions = ["Roman Catholic", "Iglesia ni Cristo", "Born Again Christian", "Aglipayan"];

// STRICT LOCATION CONSTRAINTS: Sulipan, Apalit, Pampanga
// `sitio.json` will populate `streets` if available; fallback list kept
let streets = ["Barrio Proper", "Control", "Pulong Kawayan", "Dalang Baka", "Riverside", "Caldera"];
const barangay = "Sulipan";
const municipality = "Apalit";
const province = "Pampanga";

// Education Datasets (Local institutions only)
const courses = ["BS Computer Science", "BS Information Technology", "BS Business Administration", "BS Accountancy", "BA Communication", "BS Education"];
const strands = ["STEM", "ABM", "HUMSS", "TVL - ICT", "GAS"];

const elementarySchools = [
    { name: "Sulipan Elementary School", est: 1945 },
    { name: "San Vicente Elementary School", est: 1950 }
];
const secondarySchools = [
    { name: "Apalit High School", est: 2016 },
    { name: "Saint Vincent's Academy of Apalit", est: 1985 }
];
const tertiarySchools = [
    { name: "DHVSU", est: 1961 },
    { name: "BSU", est: 1993 },
    { name: "Pampanga Colleges", est: 1937 }
];

const skillsList = ["Auto Mechanic", "Beautician", "Carpentry Work", "Computer Literate", "Domestic Chores", "Driver", "Electrician", "Embroidery", "Gardening", "Masonry", "Painter/Artist", "Photography", "Plumbing", "Sewing Dresses", "Tailoring"];

// Load external datasets (male-names.json, female-names.json, middle-last-names.json, sitio.json)
async function loadDatasets() {
    try {
        const [mRes, fRes, mlRes, sRes] = await Promise.all([
            fetch('male-names.json'),
            fetch('female-names.json'),
            fetch('middle-last-names.json'),
            fetch('sitio.json')
        ]);

        if (mRes.ok) maleNames = await mRes.json();
        if (fRes.ok) femaleNames = await fRes.json();
        if (mlRes.ok) lastNames = await mlRes.json();
        if (sRes.ok) {
            const sitios = await sRes.json();
            // normalize sitio entries into street-like labels
            streets = sitios.map(s => {
                // if entry already contains words like 'Road' or 'Sitio', keep as-is
                if (/\b(Road|Sitio|Purok|Pulong|Barrio)\b/i.test(s)) return s;
                // otherwise prefer 'Sitio X' or keep original
                return s.match(/Control/i) ? 'Sitio Control' : `Sitio ${s}`;
            });
        }

        // Fallbacks if any list is empty
        if (!maleNames || maleNames.length === 0) maleNames = ["Juan", "Pedro", "Miguel"];
        if (!femaleNames || femaleNames.length === 0) femaleNames = ["Maria", "Ana", "Lourdes"];
        if (!lastNames || lastNames.length === 0) lastNames = ["Dela Cruz", "Santos", "Garcia"];
    } catch (err) {
        console.warn('Failed to load external datasets, using built-ins', err);
        if (!maleNames.length) maleNames = ["Juan", "Pedro", "Miguel"];
        if (!femaleNames.length) femaleNames = ["Maria", "Ana", "Lourdes"];
        if (!lastNames.length) lastNames = ["Dela Cruz", "Santos", "Garcia"];
    }
}

// BASE YEAR: 2026 for all calculations
const BASE_YEAR = 2026;

// Unemployment Reason Mapping based on Age & Education
const unemploymentReasons = {
    newEntrant: ["New Entrant/Fresh Graduate", "First Time Job Seeker"],
    seasonal: ["Seasonal Work Ended", "Temporary Contract Ended"],
    career: ["Finished Contract", "Resigned", "Laid off (local)"],
    hardship: ["Health Issues", "Family Responsibilities", "Lack of Opportunity"]
};

// Utilities
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem(arr) { return arr[randomInt(0, arr.length - 1)]; }

/**
 * CORE SINGLE PROFILE GENERATION
 * Returns a single profile object with all fields
 */
function generateSingleProfile() {
    const isMale = Math.random() > 0.5;
    const fName = isMale ? randomItem(maleNames) : randomItem(femaleNames);
    const lName = randomItem(lastNames);
    let mName = randomItem(lastNames);
    while (mName === lName) { mName = randomItem(lastNames); }
    const suffix = isMale ? randomItem(suffixes) : "";

    // ===== TEMPORAL LOGIC: Base Year 2026 =====
    const age = randomInt(18, 35);
    const dobYear = BASE_YEAR - age;
    const dobMonth = randomInt(1, 12);
    const dobDay = randomInt(1, 28);
    const dobStr = `${dobMonth.toString().padStart(2, '0')}/${dobDay.toString().padStart(2, '0')}/${dobYear}`;

    // ===== LOCATION: Strict Sulipan, Apalit, Pampanga =====
    const address = `${randomItem(streets)}, ${barangay}, ${municipality}, ${province}`;
    const height = `${randomInt(4, 5)}'${randomInt(2, 11)}"`;
    const contact = `09${randomInt(100000000, 999999999)}`;
    const civilStatus = age > 24 ? randomItem(["Single", "Married"]) : "Single";
    const is4Ps = Math.random() > 1 ? `Yes (ID: ${randomInt(100000, 999999)})` : "No";

    // ===== EMPLOYMENT & LOGICAL UNEMPLOYMENT REASONS =====
    const empStatus = Math.random() > 0.4 ? "Unemployed" : "Employed";
    let unempReason = "N/A";
    if (empStatus === "Unemployed") {
        // Age-based unemployment reason logic
        if (age <= 23) {
            unempReason = randomItem(unemploymentReasons.newEntrant);
        } else if (age <= 27) {
            unempReason = randomItem([...unemploymentReasons.newEntrant, ...unemploymentReasons.seasonal]);
        } else {
            unempReason = randomItem(unemploymentReasons.career);
        }
    }

    // ===== EDUCATION TIMELINE: K-12 Aware, 2026 Base =====
    const elemGradYear = dobYear + 12; // Elem ends at age 12
    const isK12 = (elemGradYear + 4) >= 2016; // K-12 applicable if HS would start 2016+
    const hsGradYear = isK12 ? elemGradYear + 6 : elemGradYear + 4; // K-12: 6 years (4 HS + 2 SHS), Pre-K12: 4 years
    const collegeGradYear = hsGradYear + 4; // College always 4 years

    const elemSchool = randomItem(elementarySchools);
    const hsSchool = randomItem(secondarySchools);
    const collegeSchool = randomItem(tertiarySchools);
    const course = randomItem(courses);
    const strand = isK12 ? randomItem(strands) : "N/A";

    const currentlyInSchool = (age <= 23 && Math.random() > 0.4) ? "Yes" : "No";
    let collegeStatusText = "";

    if (currentlyInSchool === "Yes") {
        collegeStatusText = `Undergraduate (Currently attending 3rd Year)`;
    } else if (age < (isK12 ? 22 : 20)) {
        collegeStatusText = `Undergraduate (Level Reached: 2nd Year)`;
    } else {
        collegeStatusText = `Graduated (${collegeGradYear})`;
    }

    const hsTypeText = isK12 ? `Secondary (K-12) - Strand: ${strand}` : `Secondary (Non-K12)`;

    // Formatting HTML Outputs for Education
    const elemHTML = `
        ${elemSchool.name} 
        <span class="school-info">Est. ${elemSchool.est} | Graduated: ${elemGradYear}</span>
    `;
    const hsHTML = `
        ${hsSchool.name} <br>
        <span style="font-size:13px;">${hsTypeText}</span>
        <span class="school-info">Est. ${hsSchool.est} | Graduated: ${hsGradYear}</span>
    `;
    const collegeHTML = `
        ${collegeSchool.name} <br>
        <span style="font-size:13px;">Course: ${course}</span>
        <span class="school-info">Est. ${collegeSchool.est} | Status: ${collegeStatusText}</span>
    `;

    // Skills
    const numSkills = randomInt(1, 4);
    let skills = [];
    while (skills.length < numSkills) {
        let s = randomItem(skillsList);
        if (!skills.includes(s)) skills.push(s);
    }

    // Eligibility / License
    const isGraduated = collegeStatusText.includes("Graduated");
    let eligibility = "None";
    let prc = "N/A";

    if (isGraduated) {
        if (Math.random() > 0.6) {
            prc = randomItem(["Licensed Teacher", "CPA", "Registered Nurse"]);
            eligibility = "RA 1080 (Board Passer)";
        } else if (Math.random() > 0.5) {
            eligibility = "Civil Service Professional";
        }
    }

    // Return profile object
    return {
        personal: {
            surname: lName,
            firstName: fName,
            middleName: mName,
            suffix: suffix || "N/A",
            dob: dobStr,
            age: age,
            sex: isMale ? "Male" : "Female",
            religion: randomItem(religions),
            civilStatus: civilStatus,
            address: address,
            height: height,
            contact: contact
        },
        employment: {
            status: empStatus,
            reason: unempReason
        },
        education: {
            currentlyInSchool: currentlyInSchool,
            elementary: {
                school: elemSchool.name,
                est: elemSchool.est,
                graduated: elemGradYear
            },
            secondary: {
                school: hsSchool.name,
                est: hsSchool.est,
                graduated: hsGradYear,
                type: hsTypeText,
                strand: strand
            },
            tertiary: {
                school: collegeSchool.name,
                est: collegeSchool.est,
                course: course,
                status: collegeStatusText
            }
        },
        credentials: {
            eligibility: eligibility,
            prc: prc
        },
        skills: skills
    };
}

function displayProfile(profile) {
    const p = profile.personal;
    const e = profile.employment;
    const ed = profile.education;
    const c = profile.credentials;

    document.getElementById('val-surname').innerText = p.surname;
    document.getElementById('val-firstname').innerText = p.firstName;
    document.getElementById('val-middlename').innerText = p.middleName;
    document.getElementById('val-suffix').innerText = p.suffix;
    document.getElementById('val-dob').innerText = p.dob;
    document.getElementById('val-age').innerText = p.age;
    document.getElementById('val-sex').innerText = p.sex;
    document.getElementById('val-religion').innerText = p.religion;
    document.getElementById('val-civil').innerText = p.civilStatus;
    document.getElementById('val-address').innerText = p.address;
    document.getElementById('val-height').innerText = p.height;
    document.getElementById('val-contact').innerText = p.contact;
    document.getElementById('val-emp-status').innerText = e.status;
    document.getElementById('val-unemp-reason').innerText = e.reason;
    document.getElementById('val-4ps').innerText = Math.random() > 0.8 ? `Yes (ID: ${randomInt(100000, 999999)})` : "No";

    document.getElementById('val-inschool').innerText = ed.currentlyInSchool;
    document.getElementById('val-elem').innerHTML = `
        ${ed.elementary.school}
        <span class="school-info">Est. ${ed.elementary.est} | Graduated: ${ed.elementary.graduated}</span>
    `;
    document.getElementById('val-hs').innerHTML = `
        ${ed.secondary.school} <br>
        <span style="font-size:13px;">${ed.secondary.type}</span>
        <span class="school-info">Est. ${ed.secondary.est} | Graduated: ${ed.secondary.graduated}</span>
    `;
    document.getElementById('val-college').innerHTML = `
        ${ed.tertiary.school} <br>
        <span style="font-size:13px;">Course: ${ed.tertiary.course}</span>
        <span class="school-info">Est. ${ed.tertiary.est} | Status: ${ed.tertiary.status}</span>
    `;
    document.getElementById('val-skills').innerText = profile.skills.join(", ");
    document.getElementById('val-eligibility').innerText = c.eligibility;
    document.getElementById('val-prc').innerText = c.prc;
}


// Simple generator trigger for single profile
function generateAndDisplay() {
    const profile = generateSingleProfile();
    displayProfile(profile);
}

// Auto-generate first profile on load (ensure datasets are loaded first)
window.onload = async () => {
    await loadDatasets();
    const profile = generateSingleProfile();
    displayProfile(profile);
};
