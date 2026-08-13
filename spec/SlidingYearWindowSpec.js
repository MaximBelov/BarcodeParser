/**
 * Dates carry a two digit year, so the century has to be guessed. Section 7.1.2
 * of the GS1 General Specifications puts a sliding window around the current
 * year: a year more than fifty ahead is read as belonging to the century before,
 * rather than the fixed "51 to 99 is the twentieth century" rule upstream used.
 *
 * The window moves with the clock, so these work out the year to use rather than
 * hard coding one, which would start failing on its own some year from now.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const currentYear = new Date().getUTCFullYear();
const currentTwoDigits = currentYear % 100;
const currentCentury = currentYear - currentTwoDigits;

function expiryFor(twoDigitYear) {
    const asText = String(twoDigitYear).padStart(2, "0");

    return parseBarcode(`]C117${asText}0601`).parsedCodeItems[0].data;
}

describe("The sliding window around the current year", () => {
    it("reads a year just inside the window as this century", () => {
        const inside = currentTwoDigits + 50;

        if (inside > 99) {
            pending("a year fifty ahead is past 99 and cannot be written in two digits");
            return;
        }

        expect(expiryFor(inside).getFullYear()).toBe(currentCentury + inside);
    });

    it("reads a year just outside the window as the century before", () => {
        const outside = currentTwoDigits + 51;

        if (outside > 99) {
            pending("a year fifty one ahead is past 99 and cannot be written in two digits");
            return;
        }

        expect(expiryFor(outside).getFullYear()).toBe(currentCentury + outside - 100);
    });

    it("reads the current year as the current century", () => {
        expect(expiryFor(currentTwoDigits).getFullYear()).toBe(currentYear);
    });

    it("moves the whole window with the clock rather than cutting at 50", () => {
        const inside = currentTwoDigits + 50;

        if (inside > 99 || inside <= 50) {
            pending("the window does not reach past 50 from this year");
            return;
        }

        // Upstream's fixed rule would have made anything above 50 a 19xx year.
        expect(expiryFor(inside).getFullYear()).toBeGreaterThan(currentYear);
    });
});
