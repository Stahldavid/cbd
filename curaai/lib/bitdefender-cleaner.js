"use client";

import { useEffect } from 'react';

// This component helps clean BitDefender and similar security extensions attributes
// which cause React hydration errors
const BitDefenderCleaner = () => {
  useEffect(() => {
    console.log('🧹 Running BitDefender attribute cleaner...');
    
    // Initial clean
    const cleanBitDefenderAttributes = () => {
      const allElements = document.querySelectorAll('*');
      let cleanCount = 0;
      
      allElements.forEach(element => {
        // Check for BitDefender and similar attributes
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
          if (
            attr.name.startsWith('bis_') || 
            attr.name.startsWith('__processed_') || 
            attr.name.includes('_register')
          ) {
            element.removeAttribute(attr.name);
            cleanCount++;
          }
        });
      });
      
      if (cleanCount > 0) {
        console.log(`🧹 Cleaned ${cleanCount} BitDefender attributes from the DOM`);
      }
    };

    cleanBitDefenderAttributes();
    
    // Set up observer to clean new elements
    const observer = new MutationObserver(mutations => {
      // Only run cleaning when needed
      let hasProblematicAttributes = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const attrName = mutation.attributeName;
          if (
            attrName && (
              attrName.startsWith('bis_') || 
              attrName.startsWith('__processed_') || 
              attrName.includes('_register')
            )
          ) {
            hasProblematicAttributes = true;
            break;
          }
        }
      }
      
      if (hasProblematicAttributes) {
        cleanBitDefenderAttributes();
      }
    });
    
    observer.observe(document.body, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });

    return () => {
      // Clean up observer
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default BitDefenderCleaner;
