import { Query } from 'mongoose';

class FilterFeatures {
  public query: Query<any, any>;
  private queryString: Record<string, any>;

  constructor(query: Query<any, any>, queryString: Record<string, any>) {
    //queryString = req.query.**
    //query = Tour.find()
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1) Filter
    const queryObj = { ...this.queryString };
    const excludeQuery = ['page', 'sort', 'fields', 'limit'];
    excludeQuery.forEach((el) => delete queryObj[el]);
    const queryString = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    // 2) SORT
    if (this.queryString.sort) {
      const sortBy = JSON.stringify(this.queryString.sort).split(',').join(' ');
      this.query.sort(JSON.parse(sortBy));
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  fields() {
    // 3) FIELDS
    if (this.queryString.fields) {
      const fields = JSON.stringify(this.queryString.fields)
        .split(',')
        .join(' ');

      this.query.select(JSON.parse(fields));
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  page() {
    // 4) PAGES
   
      const page = +this.queryString.page || 1;
      const limit = +this.queryString.limit || 100;
      // const limit = +this.queryString.limit || 100;

      const skipTour = (page - 1) * limit;

      this.query.skip(skipTour).limit(limit);

    return this;
  }
}

export default FilterFeatures;
