/**
 * JSON Conversion Utilities for Supabase Integration
 * 
 * These utilities help handle JSON data type conversions between 
 * the application and Supabase PostgreSQL database.
 */

/**
 * Safely parses a JSON string or returns the original value if it's already an object
 * This is useful when working with fields that might be stored as JSON strings in PostgreSQL
 * but need to be objects in the application
 * 
 * @param {any} value - The value to parse (string or object)
 * @returns {object|array|null} The parsed object/array or null if invalid
 */
function safeParseJson(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's already an object or array, return it as is
  if (typeof value === 'object') {
    return value;
  }
  
  // Try to parse the string as JSON
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    // Return null for invalid JSON
    return null;
  }
}

/**
 * Safely stringifies an object or returns the original value if it's already a string
 * This is useful when working with fields that need to be stored as JSON strings in PostgreSQL
 * 
 * @param {any} value - The value to stringify (object or string)
 * @returns {string|null} The stringified object or null if invalid
 */
function safeStringifyJson(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's already a string, return it as is
  if (typeof value === 'string') {
    return value;
  }
  
  // Try to stringify the object
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    // Return null for invalid objects
    return null;
  }
}

/**
 * Normalizes a JSON field from the database to ensure consistent format
 * This handles both string and object representations
 * 
 * @param {any} field - The field to normalize
 * @returns {object|array|null} The normalized object/array or null if invalid
 */
function normalizeJsonField(field) {
  return safeParseJson(field);
}

/**
 * Prepares a JSON field for database storage
 * Ensures the field is properly stringified if needed
 * 
 * @param {any} field - The field to prepare
 * @returns {string|null} The prepared field as a JSON string or null if invalid
 */
function prepareJsonForDb(field) {
  return safeStringifyJson(field);
}

/**
 * Processes an entity with JSON fields from the database
 * Converts specified fields from JSON strings to objects
 * 
 * @param {object} entity - The entity to process
 * @param {string[]} jsonFields - Array of field names that should be treated as JSON
 * @returns {object} The processed entity with parsed JSON fields
 */
function processEntityFromDb(entity, jsonFields = []) {
  if (!entity) return entity;
  
  const processed = { ...entity };
  
  for (const field of jsonFields) {
    if (field in processed) {
      processed[field] = normalizeJsonField(processed[field]);
    }
  }
  
  return processed;
}

/**
 * Prepares an entity with JSON fields for database storage
 * Converts specified fields from objects to JSON strings
 * 
 * @param {object} entity - The entity to prepare
 * @param {string[]} jsonFields - Array of field names that should be treated as JSON
 * @returns {object} The prepared entity with stringified JSON fields
 */
function prepareEntityForDb(entity, jsonFields = []) {
  if (!entity) return entity;
  
  const prepared = { ...entity };
  
  for (const field of jsonFields) {
    if (field in prepared) {
      prepared[field] = prepareJsonForDb(prepared[field]);
    }
  }
  
  return prepared;
}

module.exports = {
  safeParseJson,
  safeStringifyJson,
  normalizeJsonField,
  prepareJsonForDb,
  processEntityFromDb,
  prepareEntityForDb
};
