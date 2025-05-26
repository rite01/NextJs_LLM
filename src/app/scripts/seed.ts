/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { dbConnect } from "../database/mongodb";
import Category from "../models/Category";
import Listing from "../models/Listing";
import { Types } from "mongoose";

async function seed(): Promise<void> {
  await dbConnect();

  await Category.deleteMany({});
  await Listing.deleteMany({});

  const categoriesData = [
    {
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
      location: "New York",
      basePrice: 300,
      productName: "TV Model",
      productCount: 15,
    },
    {
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
      location: "Los Angeles",
      basePrice: 100,
      productName: "Running Shoe",
      productCount: 15,
    },
    {
      name: "Smartphones",
      slug: "smartphones",
      attributeSchema: [
        {
          key: "storage",
          label: "Storage",
          type: "string",
          options: ["64GB", "128GB", "256GB", "512GB"],
        },
        {
          key: "brand",
          label: "Brand",
          type: "string",
          options: ["Apple", "Samsung", "OnePlus"],
        },
        {
          key: "5G",
          label: "5G Capable",
          type: "boolean",
        },
      ],
      location: "San Francisco",
      basePrice: 500,
      productName: "Smartphone Model",
      productCount: 10,
    },
  ];

  const createdCategories = await Promise.all(
    categoriesData.map((category) =>
      Category.create({
        name: category.name,
        slug: category.slug,
        attributeSchema: category.attributeSchema,
      })
    )
  );

  const allListings = [];

  for (let i = 0; i < createdCategories.length; i++) {
    const cat = createdCategories[i];
    const catData = categoriesData[i];

    for (let j = 0; j < catData.productCount; j++) {
      const attributes: Record<string, any> = {};

      cat.attributeSchema.forEach((attr, index) => {
        if (attr.type === "boolean") {
          attributes[attr.key] = j % 2 === 0;
        } else if (attr.options && attr.options.length > 0) {
          attributes[attr.key] = attr.options[j % attr.options.length];
        } else {
          attributes[attr.key] = null;
        }
      });

      allListings.push({
        title: `${catData.productName} ${j + 1}`,
        description: `Description for ${catData.productName} ${j + 1}`,
        price: catData.basePrice + j * 10,
        location: catData.location,
        categoryId: cat._id as Types.ObjectId,
        attributes,
      });
    }
  }

  await Listing.insertMany(allListings);

  console.log("Seed complete.");
  process.exit();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
