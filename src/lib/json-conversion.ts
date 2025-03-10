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
 * @param value - The value to parse (string or object)
 * @returns The parsed object/array or null if invalid
 */
export function safeParseJson(value: any): any {
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
 * @param value - The value to stringify (object or string)
 * @returns The stringified object or empty array string if null/undefined
 */
export function safeStringifyJson(value: any): string {
  if (value === null || value === undefined) {
    return '[]'; // Return empty array string instead of null
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
    // Return empty array string for invalid objects
    return '[]';
  }
}

/**
 * Normalizes a JSON field from the database to ensure consistent format
 * This handles both string and object representations
 * 
 * @param field - The field to normalize
 * @returns The normalized object/array or null if invalid
 */
export function normalizeJsonField(field: any): any {
  return safeParseJson(field);
}

/**
 * Prepares a JSON field for database storage
 * Ensures the field is properly stringified if needed
 * 
 * @param field - The field to prepare
 * @returns The prepared field as a JSON string
 */
export function prepareJsonForDb(field: any): string {
  return safeStringifyJson(field);
}

/**
 * Processes an entity with JSON fields from the database
 * Converts specified fields from JSON strings to objects
 * 
 * @param entity - The entity to process
 * @param jsonFields - Array of field names that should be treated as JSON
 * @returns The processed entity with parsed JSON fields
 */
export function processEntityFromDb(entity: any, jsonFields: string[] = []): any {
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
 * @param entity - The entity to prepare
 * @param jsonFields - Array of field names that should be treated as JSON
 * @returns The prepared entity with stringified JSON fields
 */
export function prepareEntityForDb(entity: any, jsonFields: string[] = []): any {
  if (!entity) return entity;
  
  const prepared = { ...entity };
  
  for (const field of jsonFields) {
    if (field in prepared) {
      prepared[field] = prepareJsonForDb(prepared[field]);
    }
  }
  
  return prepared;
}
