"""Fixed lists for business sign-up: the 77 districts of Nepal and business types."""

DISTRICTS: tuple[str, ...] = (
    # Koshi
    "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga",
    "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung",
    "Terhathum", "Udayapur",
    # Madhesh
    "Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi",
    "Siraha",
    # Bagmati
    "Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok",
    "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli",
    "Sindhupalchok",
    # Gandaki
    "Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi",
    "Nawalpur", "Parbat", "Syangja", "Tanahun",
    # Lumbini
    "Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu",
    "Parasi", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi",
    # Karnali
    "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu",
    "Rukum West", "Salyan", "Surkhet",
    # Sudurpashchim
    "Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti",
    "Kailali", "Kanchanpur",
)  # fmt: skip

BUSINESS_TYPES: tuple[str, ...] = (
    "Shop or retail",
    "Restaurant or café",
    "Hotel or guest house",
    "School or training centre",
    "Clinic or pharmacy",
    "Construction",
    "Factory or workshop",
    "Transport or delivery",
    "Office or services",
    "IT or software",
    "Farm or agriculture",
    "NGO or INGO",
    "Other",
)
