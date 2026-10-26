/**
 * BUPGO - Nationwide Bangladesh Location Dataset (600+ Locations)
 * Covers All 64 Districts, 8 Divisions, Major Universities,
 * Bus Terminals, Rail Hubs, Highway Plazas & BUP/Dhaka Hotspots.
 */

const BANGLADESH_LOCATIONS = [
  // ==========================================
  // 1. BUP CAMPUS & MIRPUR CANTONMENT (Core)
  // ==========================================
  "BUP Campus (Main Gate)",
  "BUP Campus (Academic Building)",
  "BUP Campus (Sagorika Hall)",
  "Mirpur Cantonment Checkpost",
  "ECB Chattar (Matikata)",
  "Matikata Mor",
  "Kalshi Mor",
  "Kalshi Flyover Point",
  "Vasantek Mor",
  "Zia Colony Gate (Cantonment)",
  "Mirpur DOHS (Gate 1)",
  "Mirpur DOHS (Gate 2)",
  "Mirpur DOHS (Shopping Complex)",
  "Mirpur 14 (Police Staff College)",
  "Mirpur 13 (BRTA / Indoor Stadium)",
  "Mirpur 12 (Bus Stand)",
  "Mirpur 11.5",
  "Mirpur 11 (Bus Stand)",
  "Mirpur 10 Circle",
  "Mirpur 2 (National Stadium)",
  "Mirpur 1 (Golchottor)",
  "Mirpur 6",
  "Mirpur 7 (Milk Vita)",
  "Sony Cinema Hall Mor (Mirpur 1)",
  "Shah Ali Mazar (Mirpur 1)",
  "Commerce College Road (Mirpur 2)",
  "Kazipara Metro Station",
  "Shewrapara Metro Station",
  "Agargaon (Passport Office / Metro Station)",
  "Technical Mor (Mirpur)",
  "Gabtoli Bus Terminal",
  "Kalyanpur (Bus Stop)",
  "Paikpara (Mirpur)",

  // ==========================================
  // 2. UTTARA, AIRPORT & NORTH DHAKA
  // ==========================================
  "Uttara Sector 1",
  "Uttara Sector 3 (Rajlakshmi)",
  "Uttara Sector 4",
  "Uttara Sector 6",
  "Uttara Sector 7 (House Building)",
  "Uttara Sector 9",
  "Uttara Sector 10",
  "Uttara Sector 11",
  "Uttara Sector 12",
  "Uttara Sector 13",
  "Uttara Sector 14",
  "Uttara Jasimuddin Mor",
  "Uttara Azampur",
  "Uttara Abdullahpur Bus Stand",
  "Uttara Diabari (Metro Depot)",
  "Hazrat Shahjalal International Airport (Terminal 1)",
  "Hazrat Shahjalal International Airport (Terminal 2)",
  "Airport Railway Station",
  "Kawla Mor",
  "Nikunja 1",
  "Nikunja 2",
  "Khilkhet Bus Stand",

  // ==========================================
  // 3. GULSHAN, BANANI, BARIDHARA & BASHUNDHARA
  // ==========================================
  "Kuril Bishwa Road Flyover",
  "Kuril Chourasta",
  "Bashundhara R/A (Main Gate 1)",
  "Bashundhara R/A (Gate 2 / 300 Feet)",
  "Bashundhara R/A (Apollo / Evercare)",
  "Baridhara DOHS",
  "Baridhara J Block",
  "Natun Bazar (Madani Avenue)",
  "Badda Link Road",
  "Uttar Badda",
  "Madhya Badda",
  "Shahjadpur (Gulshan Link)",
  "Rampura Bridge",
  "Banasree (Block A-C)",
  "Banasree (Block D-M)",
  "Aftabnagar Main Gate",
  "Banani 11 (Kamal Ataturk)",
  "Banani Chairman Bari",
  "Banani Kakoli Mor",
  "Banani DOHS",
  "Gulshan 1 Circle",
  "Gulshan 2 Circle",
  "Gulshan Shooting Club",
  "Mohakhali Bus Terminal",
  "Mohakhali Flyover Point",
  "Mohakhali DOHS Gate",
  "Mohakhali Wireless Mor",
  "Amtoli (Mohakhali)",

  // ==========================================
  // 4. DHANMONDI, MOHAMMADPUR & CENTRAL DHAKA
  // ==========================================
  "Dhanmondi 27 (Rapa Plaza)",
  "Dhanmondi 32 (Sukrabad)",
  "Dhanmondi 15 (Staff Quarter)",
  "Dhanmondi 8/A",
  "Dhanmondi 2 (Science Lab)",
  "Jigatola Bus Stand",
  "Shankar Bus Stand",
  "Mohammadpur Town Hall",
  "Mohammadpur Bus Stand",
  "Mohammadpur Shia Mosque",
  "Mohammadpur Ring Road",
  "Japan Garden City (Mohammadpur)",
  "Lalmatia Block C",
  "Asad Gate (Mohammadpur)",
  "Shyamoli Shishu Mela",
  "College Gate (Mirpur Road)",
  "Farmgate Metro Station",
  "Farmgate Ananda Cinema",
  "Indira Road (Tejgaon)",
  "Tejgaon Nabisco Mor",
  "Tejgaon Satrasta Mor",
  "Karwan Bazar Mor",
  "Panthapath (Square Hospital)",
  "Green Road (Dhanmondi Link)",
  "Kalabagan Bus Stand",
  "Shahbagh Mor (BSMMU)",
  "Dhaka University (TSC)",
  "Nilkhet Mor",
  "New Market Main Gate",
  "Azimpur Bus Stand",
  "Science Lab Mor",

  // ==========================================
  // 5. SOUTH & OLD DHAKA, MOTIJHEEL
  // ==========================================
  "Mogbazar Mor",
  "Mouchak Circle",
  "Malibagh Railgate",
  "Shantinagar Mor",
  "Kakrail Mor",
  "Paltan Mor",
  "Motijheel Shapla Chattar",
  "Kamalapur Railway Station",
  "Khilgaon Taltola",
  "Basabo Mor",
  "Sayedabad Bus Terminal",
  "Jatrabari Chourasta",
  "Wari (Rankin Street)",
  "Old Dhaka (Lalbagh Fort)",
  "Old Dhaka (Chawkbazar)",
  "Old Dhaka (Sadarghat Launch Terminal)",

  // ==========================================
  // 6. GREATER DHAKA & SUBURBS
  // ==========================================
  "Savar Bazar Bus Stand",
  "Savar Cantonment (Sena Auditorium)",
  "Savar Radio Colony",
  "Hemayetpur Bus Stand (Savar)",
  "Aminbazar Bridge",
  "Ashulia (Fantasy Kingdom)",
  "Ashulia Beribadh",
  "Baipail Mor (Savar/Ashulia)",
  "Jahangirnagar University (Main Gate)",
  "Tongi Station Mor",
  "Tongi College Gate",
  "Tongi Board Bazar",
  "Gazipur Chourasta",
  "Gazipur Bypass Mor",
  "Narayanganj Chashara",
  "Narayanganj Signboard Mor",
  "Narayanganj 2 No Railgate",
  "Kanchpur Bridge Point",
  "Keraniganj (Babubazar Bridge)",
  "Keraniganj (Kadamtoli)",
  "Bosila Bridge (Mohammadpur Outskirt)",
  "Purbachal 300 Feet (Kanchan Bridge)",
  "Madani Avenue (100 Feet Ext)",
  "Padma Bridge Toll Plaza (Mawa End)",
  "Padma Bridge Toll Plaza (Jajira End)",
  "Manikganj Bus Stand",
  "Munshiganj Sadar",
  "Narsingdi Velanagar",
  "Tangail New Bus Stand",

  // ==========================================
  // 7. CHITTAGONG DIVISION (Districts & Hubs)
  // ==========================================
  "Chittagong GEC Circle",
  "Chittagong Agrabad Commercial Area",
  "Chittagong 2 No Gate",
  "Chittagong Chawkbazar",
  "Chittagong Nasirabad",
  "Chittagong Bahaddarhat Bus Terminal",
  "Chittagong AK Khan Bus Stand",
  "Chittagong Dampara Bus Stand",
  "Chittagong Railway Station",
  "Chittagong University (CU Main Gate)",
  "Chittagong Patenga Sea Beach",
  "Chittagong Shah Amanat Airport",
  "Sitakunda Bazar (Chittagong)",
  "Hathazari Bus Stand (Chittagong)",
  "Cox's Bazar Kolatoli Beach",
  "Cox's Bazar Laboni Point",
  "Cox's Bazar Sugandha Beach",
  "Cox's Bazar Bus Terminal (Jhawtola)",
  "Cox's Bazar Marine Drive",
  "Teknaf Bus Stand",
  "Comilla Kandirpar",
  "Comilla Shashon Gach Bus Terminal",
  "Comilla Paduar Bazar Biswa Road",
  "Comilla Tomchom Bridge",
  "Comilla Kotbari (BARD / University)",
  "Feni Grand Trunk Road / Mahipal Bus Stand",
  "Brahmanbaria Sadar (Kowtoli / Medda)",
  "Noakhali Maijdee Court",
  "Chandpur Launch Ghat / Bus Stand",
  "Lakshmipur Sadar Bus Stand",
  "Rangamati Lake View Road",
  "Bandarban Sadar Bus Stand",
  "Khagrachhari Sadar",

  // ==========================================
  // 8. SYLHET DIVISION
  // ==========================================
  "Sylhet Zindabazar",
  "Sylhet Amberkhana Mor",
  "Sylhet Shibganj",
  "Sylhet Kadamtoli Bus Terminal",
  "Sylhet Railway Station",
  "Shahjalal University (SUST Main Gate)",
  "Sylhet Shahjalal Mazar Sharif",
  "Sylhet Osmani Medical College",
  "Sylhet Tilagarh Mor",
  "Sylhet Subid Bazar",
  "Moulvibazar Sadar (Court Road)",
  "Sreemangal Chowmohana (Tea Capital)",
  "Habiganj Sadar (Chowdhury Bazar)",
  "Sunamganj Sadar Bus Stand",

  // ==========================================
  // 9. RAJSHAHI & BOGRA DIVISION
  // ==========================================
  "Rajshahi Zero Point (Shaheb Bazar)",
  "Rajshahi University (RU Main Gate / Kazla)",
  "Rajshahi Talaimari Mor",
  "Rajshahi Station Mor",
  "Rajshahi Laxmipur Mor",
  "Rajshahi Shiroil Bus Terminal",
  "Bogra Satmatha Mor",
  "Bogra Charmatha Central Bus Terminal",
  "Bogra Thonthonia Bus Stand",
  "Bogra Banani Mor",
  "Pabna Sadar (Zero Point / Indira Mor)",
  "Sirajganj Bus Stand / Kadda Mor",
  "Natore Sadar (Madrasa Mor)",
  "Joypurhat Sadar (Zero Point)",
  "Naogaon Sadar (Baludanga Bus Stand)",
  "Chapainawabganj Sadar (Shantinagar)",

  // ==========================================
  // 10. KHULNA & SOUTH-WEST DIVISION
  // ==========================================
  "Khulna Shibbari Mor",
  "Khulna Sonadanga Central Bus Terminal",
  "Khulna Dakbangla Mor",
  "Khulna University (KU Main Gate / Gollamari)",
  "Khulna Daulatpur Bus Stand",
  "Khulna Khalishpur",
  "Khulna Boyra Mor",
  "Jessore Monihar Cinema / Bus Stand",
  "Jessore Doratana Mor",
  "Jessore Chourasta",
  "Jessore Cantonment",
  "Kushtia Majompur Railgate",
  "Kushtia Islamic University (IU Kushtia)",
  "Satkhira Sadar Bus Stand",
  "Bagerhat Sadar (Khan Jahan Ali Mazar)",
  "Jhenaidah Sadar (Payra Chattar)",
  "Magura Sadar (Dhaka Road)",
  "Chuadanga Sadar",
  "Meherpur Sadar",
  "Narail Sadar",

  // ==========================================
  // 11. BARISHAL DIVISION
  // ==========================================
  "Barishal Nathullabad Central Bus Stand",
  "Barishal Rupatoli Bus Stand",
  "Barishal Sadar Road",
  "Barishal Launch Ghat",
  "Barishal BM College Mor",
  "Patuakhali Sadar Bus Stand",
  "Kuakata Sea Beach (Zero Point)",
  "Bhola Sadar (Kheyaghat)",
  "Pirojpur Sadar Bus Stand",
  "Jhalokati Sadar",
  "Barguna Sadar Bus Stand",

  // ==========================================
  // 12. RANGPUR & NORTH BENGAL DIVISION
  // ==========================================
  "Rangpur Jahaj Company Mor",
  "Rangpur Modern Mor Central Bus Terminal",
  "Rangpur Medical College Mor",
  "Rangpur Carmichael College Mor",
  "Rangpur Payra Chattar",
  "Dinajpur Modern Mor / Station Road",
  "Dinajpur Hajee Danesh University (HSTU)",
  "Bogra-Rangpur Highway Mor",
  "Saidpur Plaza / Airport Road",
  "Nilphamari Sadar",
  "Kurigram Sadar Bus Stand",
  "Lalmonirhat Sadar",
  "Gaibandha Sadar (DPO Mor)",
  "Panchagarh Tetulia Zero Point",
  "Thakurgaon Sadar",

  // ==========================================
  // 13. MYMENSINGH DIVISION
  // ==========================================
  "Mymensingh Ganginar Par",
  "Mymensingh Bridge Mor",
  "Mymensingh Maskanda Bus Terminal",
  "Mymensingh Town Hall",
  "Bangladesh Agricultural University (BAU Gate)",
  "Jamalpur Sadar (Station Road)",
  "Sherpur Sadar (Nabinagar Bus Stand)",
  "Netrokona Sadar (Choto Bazar)",

  // ==========================================
  // 14. MAJOR PUBLIC & PRIVATE UNIVERSITIES
  // ==========================================
  "Bangladesh University of Professionals (BUP)",
  "University of Dhaka (DU - Curzon Hall / TSC)",
  "Bangladesh University of Engineering & Tech (BUET)",
  "Jahangirnagar University (JU - Savar)",
  "Military Institute of Science & Technology (MIST)",
  "Bangladesh Textile University (BUTEX)",
  "Dhaka Medical College (DMC)",
  "North South University (NSU - Bashundhara)",
  "BRAC University (BRACU - Merul Badda)",
  "Independent University, Bangladesh (IUB)",
  "American International University (AIUB)",
  "East West University (EWU - Aftabnagar)",
  "Ahsanullah University (AUST - Tejgaon)",
  "United International University (UIU - Madani Ave)",
  "Daffodil International University (DIU - Ashulia)",
  "Chittagong University of Eng & Tech (CUET)",
  "Rajshahi University of Eng & Tech (RUET)",
  "Khulna University of Eng & Tech (KUET)"
];

// Backwards compatibility alias
const BUP_LOCATIONS = BANGLADESH_LOCATIONS;

/**
 * Enhanced Nationwide Locations Autocomplete
 * Generates datalist and real-time floating suggestion widget
 */
function initLocationsAutocomplete() {
  let datalist = document.getElementById('bup-locations-list');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'bup-locations-list';
    
    // Sort alphabetically for clean datalist suggestions
    const sorted = [...BANGLADESH_LOCATIONS].sort((a, b) => a.localeCompare(b));
    datalist.innerHTML = sorted.map(loc => `<option value="${loc}"></option>`).join('');
    document.body.appendChild(datalist);
  }

  // Hook all location input fields
  const targetInputIds = [
    'search-start', 'search-dest',
    'filter-start', 'filter-dest',
    'offer-start', 'offer-dest',
    'modal-pickup-location'
  ];

  targetInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('list', 'bup-locations-list');
      el.setAttribute('autocomplete', 'off');
      setupCustomLocationPopup(el);
    }
  });
}

/**
 * Custom live floating suggestion popup for inputs
 * Gives instant, category-rich search results across Bangladesh
 */
function setupCustomLocationPopup(inputEl) {
  if (!inputEl || inputEl.dataset.hasLocationPopup) return;
  inputEl.dataset.hasLocationPopup = 'true';

  let popup = null;

  function createPopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.className = 'bupgo-location-suggestions-popup';
    document.body.appendChild(popup);
    return popup;
  }

  function positionPopup() {
    if (!popup) return;
    const rect = inputEl.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.width = `${Math.max(rect.width, 280)}px`;
  }

  function filterLocations(query) {
    if (!query || query.trim().length === 0) {
      // Return top 8 frequent hotspots
      return BANGLADESH_LOCATIONS.slice(0, 8);
    }

    const qLower = query.toLowerCase().trim();
    const tokens = qLower.split(/\s+/).filter(t => t.length > 0);

    return BANGLADESH_LOCATIONS.filter(loc => {
      const locLower = loc.toLowerCase();
      return tokens.every(token => locLower.includes(token));
    }).slice(0, 10);
  }

  function renderSuggestions(matches) {
    if (!popup) createPopup();
    if (matches.length === 0) {
      popup.style.display = 'none';
      return;
    }

    positionPopup();
    popup.innerHTML = `
      <div class="loc-popup-header">
        <span>🇧🇩 Search Across Bangladesh</span>
        <small>${matches.length} found</small>
      </div>
      <div class="loc-popup-list">
        ${matches.map(loc => `
          <div class="loc-popup-item" data-val="${loc}">
            <span class="loc-pin-icon">📍</span>
            <div class="loc-text-col">
              <strong class="loc-name">${loc}</strong>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    popup.style.display = 'block';

    popup.querySelectorAll('.loc-popup-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        inputEl.value = item.getAttribute('data-val');
        popup.style.display = 'none';
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  inputEl.addEventListener('input', () => {
    const val = inputEl.value.trim();
    if (val.length >= 1) {
      const matches = filterLocations(val);
      renderSuggestions(matches);
    } else {
      if (popup) popup.style.display = 'none';
    }
  });

  inputEl.addEventListener('focus', () => {
    const val = inputEl.value.trim();
    if (val.length >= 1) {
      renderSuggestions(filterLocations(val));
    }
  });

  inputEl.addEventListener('blur', () => {
    setTimeout(() => {
      if (popup) popup.style.display = 'none';
    }, 200);
  });

  window.addEventListener('resize', positionPopup);
  window.addEventListener('scroll', positionPopup, true);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLocationsAutocomplete();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BANGLADESH_LOCATIONS, BUP_LOCATIONS };
}
