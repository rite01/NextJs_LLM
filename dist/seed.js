import clientPromise from "../lib/mongodb";
import Category from "../models/Category";
import Listing from "../models/Listing";
async function seed() {
    await clientPromise;
    await Category.deleteMany({});
    await Listing.deleteMany({});
    const tvCategory = await Category.create({
        name: "Televisions",
        slug: "televisions",
        attributeSchema: [
            {
                key: "screenSize",
                label: "Screen Size",
                type: "string",
                options: ['32"', '40"', '50"', '60"+'],
            },
            {
                key: "brand",
                label: "Brand",
                type: "string",
                options: ["Sony", "Samsung", "LG", "Panasonic"],
            },
            { key: "smartTV", label: "Smart TV", type: "boolean" },
        ],
    });
    const shoeCategory = await Category.create({
        name: "Running Shoes",
        slug: "running-shoes",
        attributeSchema: [
            {
                key: "size",
                label: "Size",
                type: "string",
                options: ["7", "8", "9", "10", "11", "12"],
            },
            {
                key: "colour",
                label: "Colour",
                type: "string",
                options: ["red", "blue", "black", "white"],
            },
            {
                key: "brand",
                label: "Brand",
                type: "string",
                options: ["Nike", "Adidas", "Puma"],
            },
        ],
    });
    const tvs = Array.from({ length: 15 }, (_, i) => ({
        title: `TV Model ${i + 1}`,
        description: `Great TV model ${i + 1}`,
        price: 300 + i * 50,
        location: "New York",
        categoryId: tvCategory._id,
        attributes: {
            screenSize: tvCategory.attributeSchema[0].options[i % 4],
            brand: tvCategory.attributeSchema[1].options[i % 4],
            smartTV: i % 2 === 0,
        },
    }));
    const shoes = Array.from({ length: 15 }, (_, i) => ({
        title: `Running Shoe ${i + 1}`,
        description: `Comfortable shoe ${i + 1}`,
        price: 100 + i * 20,
        location: "Los Angeles",
        categoryId: shoeCategory._id,
        attributes: {
            size: shoeCategory.attributeSchema[0].options[i % 6],
            colour: shoeCategory.attributeSchema[1].options[i % 4],
            brand: shoeCategory.attributeSchema[2].options[i % 3],
        },
    }));
    await Listing.insertMany([...tvs, ...shoes]);
    console.log("Seed complete.");
    process.exit();
}
seed().catch((e) => {
    console.error(e);
    process.exit(1);
});
