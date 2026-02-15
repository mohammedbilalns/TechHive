export const validateProduct = ({
    name,
    description,
    price,
    stock,
    brand,
    category
}) => {
   

    if (!name || !name.trim()) return 'Product name is required';
    if (!description || !description.trim()) return 'Description is required';
    if (!price) return 'Price is required';
    if (!stock) return 'Stock is required';
    if (!brand || !brand.trim()) return 'Brand is required';
    if (!category) return 'Category is required';

    if (parseFloat(price) < 0) return 'Price cannot be negative';
    if (parseInt(stock) < 0) return 'Stock cannot be negative';

    return null;
};
