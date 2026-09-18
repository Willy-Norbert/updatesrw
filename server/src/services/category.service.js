const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');
const { slugify } = require('../utils/slug');

async function list() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  });
}

async function getBySlug(slug) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  });
  if (!category) throw new ApiError(404, 'Category not found');
  return category;
}

async function create(data) {
  const slug = data.slug || slugify(data.name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: data.name }, { slug }] },
  });
  if (existing) throw new ApiError(409, 'Category already exists');
  return prisma.category.create({
    data: { name: data.name, slug, description: data.description || null },
  });
}

async function update(id, data) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, 'Category not found');
  return prisma.category.update({
    where: { id },
    data: {
      name: data.name ?? category.name,
      slug: data.slug || category.slug,
      description: data.description === undefined ? category.description : data.description,
    },
  });
}

async function remove(id) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, 'Category not found');
  await prisma.category.delete({ where: { id } });
}

module.exports = { list, getBySlug, create, update, remove };
