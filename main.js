const axios = require("axios").default;
const fs = require("fs");

const getSquareMeterPrice = (locationId) =>
  axios.post(
    "https://www.hemnet.se/graphql",
    {
      query: `
query sellingPriceOverview($search: ListingSearchInput!, $limit: Int!) {
  searchSoldListings(search: $search, limit: $limit) {
    overview {
      result {
        averageSquareMeterPrice
      }
    }
  }
}
    `,
      variables: {
        limit: 0,
        search: {
          housingFormGroups: ["APARTMENTS"],
          locationIds: [locationId],
        },
      },
    },
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );

const main = async () => {
  let locations = await axios.get(
    "https://www.hemnet.se/locations/show?q=" + process.argv[2]
  );
  let prices = [];
  for (let i = 0; i < locations.data.length; i++) {
    let price = await getSquareMeterPrice(locations.data[i].id);
    if (
      price.data.data.searchSoldListings.overview &&
      price.data.data.searchSoldListings.overview.result
    ) {
      prices.push({
        name: locations.data[i].name,
        value:
          price.data.data.searchSoldListings.overview.result
            .averageSquareMeterPrice,
      });
    } else {
      prices.push({ name: locations.data[i].name, value: "" });
    }
  }

  for (let i = 0; i < prices.length; i++) {
    prices[i].value = Number(
      prices[i].value.replace(/ /g, "").replace(/ /g, "").replace("kr/m²", "")
    );
  }

  prices.sort((a, b) => b.value - a.value);

  for (const i in prices) {
    if (prices[i].value == 0) return;
    console.log(
      prices[i].name + " ".repeat(35 - prices[i].name.length),
      prices[i].value
    );
  }
};

main()
  .then(() => {})
  .catch((err) => {
    fs.writeFileSync("error.html", String(err.response.data));
    console.log("See error in error.html");
  });
