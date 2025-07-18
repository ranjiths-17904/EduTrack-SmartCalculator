import Tesseract from 'tesseract.js';

export class OCRProcessor {
  constructor() {
    this.confidenceThreshold = 60; // Further lowered for better detection
  }

  async processImage(file) {
    try {
      console.log('Starting OCR processing...');
      
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-.:()/ ',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1'
      });

      const { data } = result;
      console.log('OCR Raw Text:', data.text);
      console.log('OCR Confidence:', data.confidence);
      
      if (data.confidence < this.confidenceThreshold) {
        return {
          success: false,
          confidence: data.confidence,
          error: `Low confidence detection (${data.confidence.toFixed(1)}%). Please upload a clearer image or try manual entry.`,
          rawText: data.text
        };
      }

      const extractedData = this.parseMarksheetText(data.text);
      
      if (!extractedData.isValid) {
        return {
          success: false,
          confidence: data.confidence,
          error: 'Could not extract marksheet data accurately. Please verify the image quality or try manual entry.',
          rawText: data.text
        };
      }

      return {
        success: true,
        confidence: data.confidence,
        data: extractedData,
        rawText: data.text
      };

    } catch (error) {
      console.error('OCR Processing Error:', error);
      return {
        success: false,
        error: 'Failed to process the image. Please try again or use manual entry.'
      };
    }
  }

  parseMarksheetText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Parsing lines:', lines);
    
    // Extract semester information with improved patterns
    const semesterInfo = this.extractSemesterInfo(lines);
    console.log('Extracted semester info:', semesterInfo);
    
    // Extract student information
    const studentInfo = this.extractStudentInfo(lines);
    console.log('Extracted student info:', studentInfo);
    
    // Extract subjects with improved patterns
    const subjects = this.extractSubjects(lines);
    console.log('Extracted subjects:', subjects);
    
    // Validate extracted data
    const isValid = (semesterInfo.semester || semesterInfo.semesterFromText) && 
                   studentInfo.name && 
                   subjects.length > 0;
    
    return {
      isValid,
      semesterInfo,
      studentInfo,
      subjects,
      rawText: text
    };
  }

  extractSemesterInfo(lines) {
    const semesterPatterns = [
      /semester\s*[:\-]?\s*(\d+)/i,
      /(?:semester|sem)\s*[:\-]?\s*(\d+)/i,
      /(\d+)(?:st|nd|rd|th)?\s*semester/i,
      /sem\s*(\d+)/i,
      /(\d+)\s*sem/i,
      /(?:first|1st|i)\s*semester/i,
      /(?:second|2nd|ii)\s*semester/i,
      /(?:third|3rd|iii)\s*semester/i,
      /(?:fourth|4th|iv)\s*semester/i,
      /(?:fifth|5th|v)\s*semester/i,
      /(?:sixth|6th|vi)\s*semester/i,
      /(?:seventh|7th|vii)\s*semester/i,
      /(?:eighth|8th|viii)\s*semester/i,
      /sem\s*[:\-]?\s*(\d+)/i
    ];

    const yearPatterns = [
      /academic\s*year\s*[:\-]?\s*(\d{4}[-\s]*\d{2,4})/i,
      /year\s*[:\-]?\s*(\d{4}[-\s]*\d{2,4})/i,
      /(\d{4}[-\s]*\d{2,4})/,
      /(\d{4})\s*[-\s]\s*(\d{2,4})/
    ];

    let semester = null;
    let semesterFromText = null;
    let year = null;

    for (const line of lines) {
      // Extract semester number
      for (const pattern of semesterPatterns) {
        const match = line.match(pattern);
        if (match && !semester) {
          if (match[1]) {
            semester = parseInt(match[1]);
          } else {
            // Handle text-based semester detection
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('first') || lowerLine.includes('1st') || lowerLine.includes(' i ')) {
              semester = 1;
            } else if (lowerLine.includes('second') || lowerLine.includes('2nd') || lowerLine.includes(' ii ')) {
              semester = 2;
            } else if (lowerLine.includes('third') || lowerLine.includes('3rd') || lowerLine.includes(' iii ')) {
              semester = 3;
            } else if (lowerLine.includes('fourth') || lowerLine.includes('4th') || lowerLine.includes(' iv ')) {
              semester = 4;
            } else if (lowerLine.includes('fifth') || lowerLine.includes('5th') || lowerLine.includes(' v ')) {
              semester = 5;
            } else if (lowerLine.includes('sixth') || lowerLine.includes('6th') || lowerLine.includes(' vi ')) {
              semester = 6;
            } else if (lowerLine.includes('seventh') || lowerLine.includes('7th') || lowerLine.includes(' vii ')) {
              semester = 7;
            } else if (lowerLine.includes('eighth') || lowerLine.includes('8th') || lowerLine.includes(' viii ')) {
              semester = 8;
            }
          }
          semesterFromText = line;
          break;
        }
      }

      // Extract academic year
      for (const pattern of yearPatterns) {
        const match = line.match(pattern);
        if (match && !year) {
          year = match[1];
          break;
        }
      }
    }

    return { semester, semesterFromText, year };
  }

  extractStudentInfo(lines) {
    const namePatterns = [
      /(?:name|student\s*name)\s*[:\-]?\s*([a-zA-Z\s\.]+)/i,
      /name\s*[:\-]\s*([a-zA-Z\s\.]+)/i,
      /student\s*[:\-]\s*([a-zA-Z\s\.]+)/i
    ];

    const rollPatterns = [
      /(?:roll\s*no|roll\s*number|registration\s*no|reg\s*no)\s*[:\-]?\s*([a-zA-Z0-9\/\-]+)/i,
      /roll\s*[:\-]\s*([a-zA-Z0-9\/\-]+)/i,
      /reg\s*[:\-]\s*([a-zA-Z0-9\/\-]+)/i
    ];

    let name = null;
    let rollNumber = null;

    for (const line of lines) {
      // Extract name
      if (!name) {
        for (const pattern of namePatterns) {
          const match = line.match(pattern);
          if (match && match[1]) {
            const extractedName = match[1].trim();
            // Validate name (should be reasonable length and contain letters)
            if (extractedName.length > 2 && extractedName.length < 50 && /[a-zA-Z]/.test(extractedName)) {
              name = extractedName;
              break;
            }
          }
        }
      }

      // Extract roll number
      if (!rollNumber) {
        for (const pattern of rollPatterns) {
          const match = line.match(pattern);
          if (match && match[1]) {
            rollNumber = match[1].trim();
            break;
          }
        }
      }
    }

    return { name, rollNumber };
  }

  extractSubjects(lines) {
    const subjects = [];
    const gradePoints = {
      'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'D': 4, 'F': 0, 'U': 0, 'RA': 0
    };

    // Enhanced subject patterns
    const subjectPatterns = [
      // Pattern: CODE NAME CREDITS GRADE
      /([A-Z]{2,4}\d{2,4})\s+([A-Za-z\s&\-\.]{3,40}?)\s+(\d+)\s+([A-Z+]{1,3})(?:\s|$)/,
      // Pattern: S.No CODE NAME CREDITS GRADE
      /\d+\.\s*([A-Z]{2,4}\d{2,4})\s+([A-Za-z\s&\-\.]{3,40}?)\s+(\d+)\s+([A-Z+]{1,3})(?:\s|$)/,
      // Pattern: CODE : NAME Credits: X Grade: Y
      /([A-Z]{2,4}\d{2,4})\s*[:\-]?\s*([A-Za-z\s&\-\.]{3,40}?)\s+(?:credits?|cr)\s*[:\-]?\s*(\d+)\s+(?:grade|gr)\s*[:\-]?\s*([A-Z+]{1,3})/i,
      // Pattern with more flexible spacing
      /([A-Z]{2,4}\d{2,4})\s+([A-Za-z][A-Za-z\s&\-\.]{3,40}?)\s+(\d+)\s+([A-Z+]{1,3})(?:\s|$)/,
      // Pattern with tabs or multiple spaces
      /([A-Z]{2,4}\d{2,4})\s{2,}([A-Za-z\s&\-\.]{3,40}?)\s{2,}(\d+)\s{2,}([A-Z+]{1,3})/,
      // Pattern for different formats
      /([A-Z]{2,4}\d{2,4})\s*[-|]\s*([A-Za-z\s&\-\.]{3,40}?)\s*[-|]\s*(\d+)\s*[-|]\s*([A-Z+]{1,3})/
    ];

    for (const line of lines) {
      for (const pattern of subjectPatterns) {
        const match = line.match(pattern);
        if (match) {
          const [, code, name, credits, grade] = match;
          
          // Validate extracted data
          const cleanCode = code.trim();
          const cleanName = name.trim();
          const cleanCredits = parseInt(credits);
          const cleanGrade = grade.trim().toUpperCase();

          // Check if grade is valid
          if (gradePoints.hasOwnProperty(cleanGrade) && 
              cleanCode.length >= 4 && 
              cleanName.length >= 3 && 
              cleanCredits > 0 && cleanCredits <= 10) {
            
            subjects.push({
              id: Date.now() + Math.random(),
              code: cleanCode,
              name: cleanName,
              credits: cleanCredits,
              grade: cleanGrade,
              points: gradePoints[cleanGrade]
            });
          }
        }
      }
    }

    // Remove duplicates based on subject code
    const uniqueSubjects = subjects.filter((subject, index, self) =>
      index === self.findIndex(s => s.code === subject.code)
    );

    return uniqueSubjects;
  }
}