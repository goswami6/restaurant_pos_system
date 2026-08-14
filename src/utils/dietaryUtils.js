export const getDietaryInfo = (item) => {
    if (!item) return 'Veg';
    const dietary = String(item?.dietary_info || '').toLowerCase();
    const nameLower = String(item?.item_name || item?.name || '').toLowerCase();

    if (
        nameLower.includes('non veg') || nameLower.includes('non-veg') ||
        nameLower.includes('chicken') || nameLower.includes('mutton') ||
        nameLower.includes('fish') || nameLower.includes('prawn') ||
        nameLower.includes('pork') || nameLower.includes('beef') ||
        nameLower.includes('kebab') || nameLower.includes('kabab') ||
        (nameLower.includes('tandoori') && !nameLower.includes('paneer') && !nameLower.includes('veg') && !nameLower.includes('gobi') && !nameLower.includes('mushroom')) ||
        (nameLower.includes('tikka') && !nameLower.includes('paneer') && !nameLower.includes('veg') && !nameLower.includes('gobi') && !nameLower.includes('mushroom'))
    ) {
        return 'Non-Veg';
    }
    if (nameLower.includes('egg') || nameLower.includes('anda') || nameLower.includes('omelette') || nameLower.includes('omlet')) {
        return 'Egg';
    }
    if (dietary.includes('non')) return 'Non-Veg';
    if (dietary.includes('egg')) return 'Egg';

    return 'Veg';
};
