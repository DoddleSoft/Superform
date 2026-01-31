import { FormDesignSettings, DEFAULT_DESIGN_SETTINGS, FormFontFamily, ButtonCornerRadius } from "@/types/form-builder";

// Map font family values to actual CSS font stacks
export const FONT_FAMILY_MAP: Record<FormFontFamily, string> = {
    'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'inter': '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    'roboto': '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
    'poppins': '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
    'open-sans': '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    'lato': '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
    'montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
    'playfair': '"Playfair Display", Georgia, serif',
    'merriweather': '"Merriweather", Georgia, serif',
};

// Map button corner radius values to actual CSS values
export const BUTTON_RADIUS_MAP: Record<ButtonCornerRadius, string> = {
    'none': '0',
    'sm': '0.25rem',
    'md': '0.5rem',
    'lg': '0.75rem',
    'full': '9999px',
};

// Question spacing values
export const QUESTION_SPACING_MAP: Record<FormDesignSettings['questionSpacing'], string> = {
    'compact': '1rem',
    'normal': '1.5rem',
    'relaxed': '2.5rem',
};

// Generate CSS custom properties from design settings
export function generateDesignStyles(settings: Partial<FormDesignSettings> = {}): React.CSSProperties {
    const mergedSettings = { ...DEFAULT_DESIGN_SETTINGS, ...settings };
    
    return {
        '--form-bg-color': mergedSettings.backgroundColor,
        '--form-primary-color': mergedSettings.primaryColor,
        '--form-text-color': mergedSettings.textColor,
        '--form-button-color': mergedSettings.buttonColor,
        '--form-button-text-color': mergedSettings.buttonTextColor,
        '--form-font-family': FONT_FAMILY_MAP[mergedSettings.fontFamily],
        '--form-button-radius': BUTTON_RADIUS_MAP[mergedSettings.buttonCornerRadius],
        '--form-question-spacing': QUESTION_SPACING_MAP[mergedSettings.questionSpacing],
    } as React.CSSProperties;
}

// Generate Google Fonts import URL for non-system fonts
export function getGoogleFontsUrl(fontFamily: FormFontFamily): string | null {
    const fontMap: Partial<Record<FormFontFamily, string>> = {
        'inter': 'Inter:wght@300;400;500;600;700',
        'roboto': 'Roboto:wght@300;400;500;700',
        'poppins': 'Poppins:wght@300;400;500;600;700',
        'open-sans': 'Open+Sans:wght@300;400;500;600;700',
        'lato': 'Lato:wght@300;400;700',
        'montserrat': 'Montserrat:wght@300;400;500;600;700',
        'playfair': 'Playfair+Display:wght@400;500;600;700',
        'merriweather': 'Merriweather:wght@300;400;700',
    };
    
    const fontWeight = fontMap[fontFamily];
    if (!fontWeight) return null;
    
    return `https://fonts.googleapis.com/css2?family=${fontWeight}&display=swap`;
}

// Get all Google Fonts URLs for a list of font families
export function getAllGoogleFontsUrls(fontFamilies: FormFontFamily[]): string[] {
    return fontFamilies
        .map(getGoogleFontsUrl)
        .filter((url): url is string => url !== null);
}

// Generate inline style for form wrapper
export function getFormWrapperStyle(settings: Partial<FormDesignSettings> = {}): React.CSSProperties {
    const mergedSettings = { ...DEFAULT_DESIGN_SETTINGS, ...settings };
    
    return {
        ...generateDesignStyles(settings),
        backgroundColor: mergedSettings.backgroundColor,
        fontFamily: FONT_FAMILY_MAP[mergedSettings.fontFamily],
        color: mergedSettings.textColor,
    };
}

// Generate button style
export function getButtonStyle(settings: Partial<FormDesignSettings> = {}): React.CSSProperties {
    const mergedSettings = { ...DEFAULT_DESIGN_SETTINGS, ...settings };
    
    return {
        backgroundColor: mergedSettings.buttonColor,
        color: mergedSettings.buttonTextColor,
        borderRadius: BUTTON_RADIUS_MAP[mergedSettings.buttonCornerRadius],
    };
}
