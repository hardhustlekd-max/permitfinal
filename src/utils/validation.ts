/**
 * Input validation utilities for Motorcycle Permit Registration System
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates full name. It should have at least 3 characters and contain only letters and spaces.
 */
export const validateFullName = (name: string, isAmharic: boolean): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: isAmharic ? 'እባክዎ የባለቤት ሙሉ ስም ያስገቡ!' : 'Please enter Owner Full Name!',
    };
  }
  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: isAmharic ? 'የባለቤት ስም ቢያንስ 3 ቁምፊዎች መሆን አለበት!' : 'Owner Name must be at least 3 characters!',
    };
  }
  // Allow English letters/spaces, or Amharic Unicode block (0x1200 - 0x137F)
  const nameRegex = /^[A-Za-z\s\u1200-\u137F]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      message: isAmharic
        ? 'ስም ውስጥ ልዩ ምልክቶች ወይም ቁጥሮች አይፈቀዱም!'
        : 'Special characters or numbers are not allowed in Owner Name!',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates phone number formats (standard Ethiopian formats like +251 9... or 09... / 07...).
 */
export const validatePhone = (phone: string, isAmharic: boolean): ValidationResult => {
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return {
      isValid: false,
      message: isAmharic ? 'እባክዎ ስልክ ቁጥር ያስገቡ!' : 'Please enter Phone Number!',
    };
  }

  // Regexes for Ethiopian numbers:
  // - Starts with +2517... or +2519... followed by 8 digits (12 total digits)
  // - Starts with 09... or 07... followed by 8 digits (10 total digits)
  const ethioRegex = /^(?:\+251[79]\d{8}|0[79]\d{8})$/;
  if (!ethioRegex.test(trimmed)) {
    return {
      isValid: false,
      message: isAmharic
        ? 'ትክክለኛ ያልሆነ የስልክ ቅርጸት! እባክዎ ምሳሌ፡ +251911000000 ወይም 0911000000 ይጠቀሙ።'
        : 'Invalid phone format! Use e.g. +251911000000 or 0911000000.',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates Ethiopian vehicle/motorcycle plate format.
 * Format examples: AA-2-M8841, AA-2-A0000, OR-2-12345
 */
export const validatePlateNumber = (plate: string, isAmharic: boolean): ValidationResult => {
  const trimmed = plate.trim().toUpperCase();
  if (!trimmed) {
    return {
      isValid: false,
      message: isAmharic ? 'እባክዎ የሰሌዳ ቁጥር ያስገቡ!' : 'Please enter Plate Number!',
    };
  }

  // Region prefix (AA, OR, DR, SP, AM, TI, AF, BG, SO, HA, SW)
  // Code (2 for Motorcycle/Light vehicles)
  // Alphanumeric identifier (usually starting with M, E or digits)
  const plateRegex = /^(AA|OR|DR|SP|AM|TI|AF|BG|SO|HA|SW|DD|SN|NE|FE|BE|HR|WE)-\d-([A-Z\d]\d{3,5})$/i;
  if (!plateRegex.test(trimmed)) {
    return {
      isValid: false,
      message: isAmharic
        ? 'ትክክለኛ ያልሆነ የሰሌዳ ቅርጸት! ምሳሌ፡ AA-2-M8841'
        : 'Invalid plate format! Example: AA-2-M8841 (Region-Code-Serial)',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates chassis or engine serial number (alphanumeric, at least 5 chars).
 */
export const validateEngineOrSerial = (serial: string, isAmharic: boolean): ValidationResult => {
  const trimmed = serial.trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: isAmharic ? 'እባክዎ የሞተር ወይም ሴሪያል ቁጥር ያስገቡ!' : 'Please enter Engine or Serial Number!',
    };
  }
  if (trimmed.length < 5) {
    return {
      isValid: false,
      message: isAmharic
        ? 'የሴሪያል ቁጥር ቢያንስ 5 ቁምፊዎች መሆን አለበት!'
        : 'Serial Number must be at least 5 characters!',
    };
  }
  const alphanumericRegex = /^[A-Z0-9\-_]+$/i;
  if (!alphanumericRegex.test(trimmed)) {
    return {
      isValid: false,
      message: isAmharic
        ? 'ሴሪያል ቁጥር ውስጥ ፊደላት፣ ቁጥሮች እና (-/_) ብቻ ይፈቀዳሉ!'
        : 'Only alphanumeric characters, dashes, and underscores are allowed in Serial Number!',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates badge IDs (must be alphanumeric and not empty, e.g., OFFICER-1234, CLERK-01).
 */
export const validateBadgeId = (badge: string, isAmharic: boolean): ValidationResult => {
  const trimmed = badge.trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: isAmharic ? 'እባክዎ የመለያ ቁጥር (Badge ID) ያስገቡ!' : 'Please enter Badge ID!',
    };
  }
  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: isAmharic ? 'መለያ ቁጥር ቢያንስ 3 ቁምፊዎች መሆን አለበት!' : 'Badge ID must be at least 3 characters!',
    };
  }
  const badgeRegex = /^[A-Z0-9\-_]+$/i;
  if (!badgeRegex.test(trimmed)) {
    return {
      isValid: false,
      message: isAmharic
        ? 'መለያ ቁጥር ውስጥ ፊደላት፣ ቁጥሮች እና ዳሽ (-) ብቻ ይፈቀዳሉ!'
        : 'Only alphanumeric characters, dashes, and underscores are allowed in Badge ID!',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * General validator for alphanumeric words (e.g. brand, model, location).
 */
export const validateRequiredText = (text: string, label: string, isAmharic: boolean, minLength = 2): ValidationResult => {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      isValid: false,
      message: isAmharic ? `እባክዎ ${label} ያስገቡ!` : `Please enter ${label}!`,
    };
  }
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      message: isAmharic
        ? `${label} ቢያንስ ${minLength} ቁምፊዎች መሆን አለበት!`
        : `${label} must be at least ${minLength} characters!`,
    };
  }
  return { isValid: true, message: '' };
};
