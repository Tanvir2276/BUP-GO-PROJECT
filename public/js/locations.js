/**
 * BUPGO - Comprehensive Dhaka & Outskirts Location Dataset (120+ Locations)
 * Designed for BUP Campus commuters
 */

const BUP_LOCATIONS = [
  // --- Mirpur & Cantonment Surroundings ---
  "Mirpur 10 Circle",
  "Mirpur 1 (Golchottor)",
  "Mirpur 2 (Stadium)",
  "Mirpur 6",
  "Mirpur 7 (Milk Vita)",
  "Mirpur 11 (Bus Stand)",
  "Mirpur 11.5",
  "Mirpur 12 (Bus Stand)",
  "Mirpur 13 (BRTA)",
  "Mirpur 14 (Police Staff College)",
  "Mirpur DOHS (Gate 1)",
  "Mirpur DOHS (Gate 2)",
  "Mirpur DOHS (Shopping Complex)",
  "Kazipara Metro Station",
  "Shewrapara Metro Station",
  "Agargaon (Passport Office / Metro)",
  "Technical Mor (Mirpur)",
  "Gabtoli Bus Terminal",
  "Kalyanpur (Bus Stop)",
  "Paikpara (Mirpur)",
  "Sony Cinema Hall Mor (Mirpur 1)",
  "Shah Ali Mazar (Mirpur 1)",
  "Commerce College Road (Mirpur 2)",

  // --- BUP Campus & Mirpur Cantonment ---
  "BUP Campus (Main Gate)",
  "BUP Campus (Academic Building)",
  "Mirpur Cantonment Checkpost",
  "Sagorika Hall (BUP)",
  "ECB Chattar (Matikata)",
  "Matikata Mor",
  "Kalshi Mor",
  "Kalshi Flyover Point",
  "Vasantek Mor",
  "Zia Colony Gate",

  // --- Uttara Sectors & Airport ---
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

  // --- Kuril, Baridhara, Bashundhara & Badda ---
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

  // --- Gulshan, Banani & Mohakhali ---
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
  "Nikunja 1",
  "Nikunja 2",
  "Khilkhet Bus Stand",

  // --- Dhanmondi, Mohammadpur & Lalmatia ---
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

  // --- Central Dhaka (Farmgate, Karwan Bazar, Shahbagh) ---
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

  // --- South & East Dhaka (Motijheel, Old Dhaka, Malibagh) ---
  "Mogbazar Mor",
  "Mouchak Circle",
  "Malibagh Railgate",
  "Shantinagar Mor",
  "Kakrail Mor",
  "Paltan Mor",
  "Motijheel Shapla Chattar",
  "Khilgaon Taltola",
  "Basabo Mor",
  "Sayedabad Bus Terminal",
  "Jatrabari Chourasta",
  "Wari (Rankin Street)",
  "Old Dhaka (Lalbagh Fort)",
  "Old Dhaka (Chawkbazar)",
  "Old Dhaka (Sadarghat Launch Terminal)",

  // --- Suburbs, Outskirts & Greater Dhaka ---
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
  "Kanchpur Bridge Point",
  "Keraniganj (Babubazar Bridge)",
  "Keraniganj (Kadamtoli)",
  "Bosila Bridge (Mohammadpur Outskirt)",
  "Purbachal 300 Feet (Kanchan Bridge)",
  "Madani Avenue (100 Feet Ext)"
];

/**
 * Injects a global <datalist id="bup-locations-list"> into document body
 * and hooks up all location input fields for instant search autocomplete.
 */
function initLocationsAutocomplete() {
  let datalist = document.getElementById('bup-locations-list');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'bup-locations-list';
    
    // Sort alphabetically for clean suggestions
    const sorted = [...BUP_LOCATIONS].sort((a, b) => a.localeCompare(b));
    datalist.innerHTML = sorted.map(loc => `<option value="${loc}"></option>`).join('');
    document.body.appendChild(datalist);
  }

  // Hook all location input fields
  const targetInputs = [
    'search-start', 'search-dest',
    'filter-start', 'filter-dest',
    'offer-start', 'offer-dest',
    'modal-pickup-location'
  ];

  targetInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('list', 'bup-locations-list');
      el.setAttribute('autocomplete', 'off');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLocationsAutocomplete();
});
