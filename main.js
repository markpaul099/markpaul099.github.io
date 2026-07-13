// Dataset holders (populated from external JSON files when available)
let maleNames = [];
let femaleNames = [];
let lastNames = [];
const suffixes = ["", "", "", "", "", "Jr.", "III"];

// Address & Demographics
const religions = ["Roman Catholic", "INC", "Born Again Christian", "MCGI", "Christian"];

// STRICT LOCATION CONSTRAINTS: Sulipan, Apalit, Pampanga
// `sitio.json` will populate `streets` if available
let streets = ["Barrio Proper", "Control", "Pulong Kawayan", "Dalang Baka", "Riverside", "Caldera"];
const barangay = "Sulipan";
const municipality = "Apalit";
const province = "Pampanga";

// Education Datasets (Local institutions only)
const courses = ["BS Computer Science", "BS Information Technology", "BS Business Administration", "BS Accountancy", "BA Communication", "BS Education"];
const strands = ["STEM", "ABM", "HUMSS", "TVL - ICT", "GAS"];

const elementarySchools = [
    { name: "Sulipan Elementary School", est: 1945 },
    { name: "San Vicente Elementary School", est: 1950 },
    { name: "AMA Basic Education of Apalit", est: 2010 },
    { name: "La Verdad Christian College", est: 2009 }
];
const secondarySchools = [
    { name: "Apalit High School", est: 2016 },
    { name: "Gonzales Memorial Academy", est: 1955, closed: 2015 },
    { name: "Saint Vincent's Academy of Apalit", est: 1985 },
    { name: "AMA Basic Education of Apalit", est: 2010 },
    { name: "Senior High School in Apalit", est: 2016 },
    { name: "ATEC Technological College Apalit", est: 2019 },
    { name: "La Verdad Christian College", est: 2009 }
];  
const tertiarySchools = [
    { name: "DHVSU", est: 1961 },
    { name: "BULSU", est: 1993 },
    { name: "ACLC College of Apalit", est: 2010 },
    { name: "La Verdad Christian College", est: 2009 }
];

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

    } catch (err) {
        console.error('Failed to load external datasets', err);
    }
}

const datasetsReady = loadDatasets();

// BASE YEAR: 2026 for all calculations
const BASE_YEAR = 2026;
const MIN_ELEMENTARY_START_AGE = 6;
const MIN_SECONDARY_START_AGE = 12;
const MIN_COLLEGE_START_AGE = 16;
const COLLEGE_APPEARANCE_CHANCE = 0.25;

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

function ordinal(n) {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
}

function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatStatusWithLevel(baseStatus, levelReached) {
    return levelReached ? `${baseStatus} (Level Reached: ${levelReached})` : baseStatus;
}

function getElementaryLevelReached(startYear, lastAttendedYear) {
    if (!startYear || !lastAttendedYear || lastAttendedYear < startYear) return null;
    const grade = clampNumber(lastAttendedYear - startYear + 1, 1, 6);
    return `Grade ${grade}`;
}

function getSecondaryLevelReached(startYear, lastAttendedYear, isK12) {
    if (!startYear || !lastAttendedYear || lastAttendedYear < startYear) return null;
    if (isK12) {
        const grade = clampNumber(lastAttendedYear - startYear + 7, 7, 12);
        return `Grade ${grade}`;
    }

    const year = clampNumber(lastAttendedYear - startYear + 1, 1, 4);
    return `${ordinal(year)} Year High School`;
}

function getCollegeLevelReached(startYear, lastAttendedYear) {
    if (!startYear || !lastAttendedYear || lastAttendedYear < startYear) return null;
    const year = clampNumber(lastAttendedYear - startYear + 1, 1, 4);
    return `${ordinal(year)} Year College`;
}

// Select a school whose establishment year makes it possible for a person
// with a given graduation year to have attended it. Returns null if none.
function selectEligibleSchool(schools, latestAllowedYear) {
    // only include schools that were established on/before the target year
    // and that had not closed before that year (if a `closed` year is provided)
    const eligible = schools.filter(s => s.est && s.est <= latestAllowedYear && (!s.closed || s.closed >= latestAllowedYear));
    if (eligible.length === 0) return null;
    return randomItem(eligible);
}

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
    const age = randomInt(18, 50);
    const dobYear = BASE_YEAR - age;
    const dobMonth = randomInt(1, 12);
    const dobDay = randomInt(1, 28);
    const dobStr = `${dobMonth.toString().padStart(2, '0')}/${dobDay.toString().padStart(2, '0')}/${dobYear}`;

    // ===== LOCATION: Strict Sulipan, Apalit, Pampanga =====
    const address = `${randomItem(streets)}, ${barangay}, ${municipality}, ${province}`;
    const height = `${randomInt(4, 5)}'${randomInt(2, 11)}"`;
    const contact = `09${randomInt(100000000, 999999999)}`;
    const civilStatus = age > 24 ? randomItem(["Single", "Married"]) : "Single";

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

    // Elementary must be completed before secondary; secondary must be completed before tertiary
    // reduce completion probability so "Not Finished" occurs more often
    const elementaryEligible = age >= MIN_ELEMENTARY_START_AGE;
    let elementaryCompleted = elementaryEligible && age >= 12 && Math.random() > 0.6;
    let secondaryCompleted = elementaryCompleted && age >= 18 && Math.random() > 0.5;

    // We'll no longer pick specific school names. Instead generate realistic
    // education statuses, strands and courses based on age and K-12 timing.
    const course = randomItem(courses);
    const strand = isK12 ? randomItem(strands) : "N/A";

    // currentlyInSchool should be plausible given progression
    let currentlyInSchool = "No";
    if (age < 12) {
        currentlyInSchool = "Yes"; // likely still in elementary
    } else if (age < 18) {
        // in secondary only if elementary was completed
        currentlyInSchool = elementaryCompleted && Math.random() > 0.4 ? "Yes" : "No";
    } else {
        // college-age: only if secondary was completed
        currentlyInSchool = secondaryCompleted && age <= 23 && Math.random() > 0.4 ? "Yes" : "No";
    }

    let collegeStatusText = "";
    let collegeLastAttended = null;
    const showCollege = secondaryCompleted && Math.random() < COLLEGE_APPEARANCE_CHANCE;

    // compute plausible attendance windows
    const elemStartYear = dobYear + 6; // typical school starting age 6
    const elemEndYear = elemGradYear; // dob + 12
    const hsStartYear = elemEndYear; // high school starts same year elementary ends
    const hsEndYear = hsGradYear;
    const collegeStartYear = hsEndYear; // college starts same year HS ends
    const collegeEndYear = collegeGradYear;

    // last attended years for incomplete/partial attendance
    let elemLastAttended = null;
    if (!elementaryEligible) {
        elemLastAttended = null;
    } else if (age < 12) {
        elemLastAttended = Math.min(BASE_YEAR, dobYear + age);
    } else if (!elementaryCompleted) {
        const maxYear = Math.min(elemEndYear, BASE_YEAR);
        const minYear = Math.max(elemStartYear, dobYear + 1);
        if (minYear <= maxYear) elemLastAttended = randomInt(minYear, maxYear);
    } else {
        elemLastAttended = elemEndYear;
    }

    const elemLevelReached = getElementaryLevelReached(elemStartYear, elemLastAttended);
    const elemStatusText = !elementaryEligible
        ? "Not Yet Started"
        : elementaryCompleted
            ? `Completed (${elemGradYear})`
            : formatStatusWithLevel(age < 12 ? "In Progress" : "Not Finished", elemLevelReached);

    let hsLastAttended = null;
    if (!elementaryCompleted) {
        hsLastAttended = null;
    } else if (age < 18) {
        hsLastAttended = Math.min(BASE_YEAR, dobYear + age);
    } else if (!secondaryCompleted) {
        const maxYear = Math.min(hsEndYear, BASE_YEAR);
        const minYear = hsStartYear;
        if (minYear <= maxYear) hsLastAttended = randomInt(minYear, maxYear);
    } else {
        hsLastAttended = hsEndYear;
    }

    const hsLevelReached = getSecondaryLevelReached(hsStartYear, hsLastAttended, isK12);
    const hsStatusText = !elementaryCompleted
        ? "Not Started"
        : secondaryCompleted
            ? `Completed (${hsGradYear})`
            : formatStatusWithLevel(age < 18 ? "In Progress" : "Not Finished", hsLevelReached);

    if (showCollege) {
        // determine college status based on age and current-in-school flag
        if (age <= 30) {
            if (currentlyInSchool === "Yes") {
                collegeStatusText = "Undergraduate";
                const maxCA = Math.min(BASE_YEAR, collegeEndYear);
                const minCA = Math.max(collegeStartYear, collegeStartYear);
                if (minCA <= maxCA) collegeLastAttended = randomInt(minCA, maxCA);
            } else if (age < (isK12 ? 22 : 20)) {
                collegeStatusText = "Undergraduate";
                const maxCA = Math.min(BASE_YEAR, collegeEndYear);
                const minCA = Math.max(collegeStartYear, collegeStartYear);
                if (minCA <= maxCA) collegeLastAttended = randomInt(minCA, maxCA);
            } else {
                collegeStatusText = `Graduated (${collegeGradYear})`;
                collegeLastAttended = collegeEndYear;
            }
        } else {
            collegeStatusText = `Graduated (${collegeGradYear})`;
            collegeLastAttended = collegeEndYear;
        }
    } else {
        collegeStatusText = "Not Applicable";
    }

    if (collegeStatusText === "Undergraduate") {
        const collegeLevelReached = getCollegeLevelReached(collegeStartYear, collegeLastAttended);
        collegeStatusText = formatStatusWithLevel(collegeStatusText, collegeLevelReached);
    }

    // do not coerce missing schools into objects here — keep null so returned
    // `education.secondary` remains null when elementary is incomplete.

    const hsTypeText = isK12 ? `Secondary (K-12)` : `Secondary (Non-K12)`;

    // We won't display school names or establishment years. Prepare simple
    // strings with level/strand/course/status suitable for the UI.
    const elemHTML = `
        <span class="school-info">Level: ${elemLevelReached || 'N/A'} | Status: ${elemStatusText}${elemLastAttended ? ` | Last Attended: ${elemLastAttended}` : ''}</span>
    `;
    const hsHTML = `
        <span style="font-size:13px;">${hsTypeText} - Strand: ${strand}</span>
        <span class="school-info">Level: ${hsLevelReached || 'N/A'} | Status: ${hsStatusText}${hsLastAttended ? ` | Last Attended: ${hsLastAttended}` : ''}</span>
    `;
    const collegeHTML = showCollege ? `
        <span style="font-size:13px;">Course: ${course}</span>
        <span class="school-info">Status: ${collegeStatusText}${collegeLastAttended ? ` | Last Attended: ${collegeLastAttended}` : ''}</span>
    ` : '';

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
                levelReached: elemLevelReached,
                status: elemStatusText,
                lastAttended: elemLastAttended
            },
            secondary: elementaryCompleted ? {
                type: hsTypeText,
                strand: strand,
                levelReached: hsLevelReached,
                status: hsStatusText,
                lastAttended: hsLastAttended
            } : null,
            tertiary: showCollege ? {
                course: course,
                status: collegeStatusText,
                lastAttended: collegeLastAttended || null
            } : null
        }
    };
}

function displayProfile(profile) {
    try {
        const p = profile.personal;
        const e = profile.employment;
        const ed = profile.education;

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };
        const setHTML = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        setText('val-surname', p.surname);
        setText('val-firstname', p.firstName);
        setText('val-middlename', p.middleName);
        setText('val-suffix', p.suffix);
        setText('val-dob', p.dob);
        setText('val-age', p.age);
        setText('val-sex', p.sex);
        setText('val-religion', p.religion);
        setText('val-civil', p.civilStatus);
        setText('val-address', p.address);
        setText('val-height', p.height);
        setText('val-contact', p.contact);
        setText('val-emp-status', e.status);
        setText('val-unemp-reason', e.reason);

        setText('val-inschool', ed.currentlyInSchool);

        setHTML('val-elem', `
            ${ed.elementary.status} <br>
            <span class="school-info">Level: ${ed.elementary.levelReached || 'N/A'}${ed.elementary.lastAttended ? ` | Last Attended: ${ed.elementary.lastAttended}` : ''}</span>
        `);

        const hsEl = document.getElementById('val-hs');
        const hsField = hsEl ? hsEl.closest('.field') : null;
        if (hsEl && hsField) {
            if (ed.secondary) {
                hsField.style.display = '';
                hsEl.innerHTML = `
                    <span style="font-size:13px;">${ed.secondary.type} - Strand: ${ed.secondary.strand}</span>
                    <span class="school-info">Level: ${ed.secondary.levelReached || 'N/A'} | Status: ${ed.secondary.status}${ed.secondary.lastAttended ? ` | Last Attended: ${ed.secondary.lastAttended}` : ''}</span>
                `;
            } else {
                hsField.style.display = 'none';
                if (hsEl) hsEl.innerHTML = '';
            }
        } else if (hsField) {
            hsField.style.display = 'none';
            if (hsEl) hsEl.innerHTML = '';
        }

        const collegeEl = document.getElementById('val-college');
        const collegeField = collegeEl ? collegeEl.closest('.field') : null;
        if (collegeEl && collegeField) {
            if (ed.tertiary) {
                collegeField.style.display = '';
                collegeEl.innerHTML = `
                    <span style="font-size:13px;">Course: ${ed.tertiary.course}</span>
                    <span class="school-info">Status: ${ed.tertiary.status}${ed.tertiary.lastAttended ? ` | Last Attended: ${ed.tertiary.lastAttended}` : ''}</span>
                `;
            } else {
                collegeField.style.display = 'none';
                if (collegeEl) collegeEl.innerHTML = '';
            }
        } else if (collegeField) {
            collegeField.style.display = 'none';
            if (collegeEl) collegeEl.innerHTML = '';
        }
    } catch (err) {
        console.error('displayProfile error', err);
    }
}


// Simple generator trigger for single profile
async function generateAndDisplay() {
    try {
        await datasetsReady;
        const profile = generateSingleProfile();
        displayProfile(profile);
    } catch (err) {
        console.error('generateAndDisplay error', err);
    }
}

// Auto-generate first profile on load (ensure datasets are loaded first)
window.onload = async () => {
    await datasetsReady;
    const profile = generateSingleProfile();
    displayProfile(profile);
};
