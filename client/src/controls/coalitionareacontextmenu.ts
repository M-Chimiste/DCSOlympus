import { LatLng } from "leaflet";
import { getMap, getUnitsManager } from "..";
import { GAME_MASTER, IADSTypes } from "../constants/constants";
import { CoalitionArea } from "../map/coalitionarea";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";
import { Slider } from "./slider";
import { Switch } from "./switch";
import { groundUnitDatabase } from "../units/groundunitdatabase";

export class CoalitionAreaContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #coalitionArea: CoalitionArea | null = null;
    #iadsDensitySlider: Slider;
    #iadsDistributionSlider: Slider;
    #iadsTypesDropdown: Dropdown;
    #iadsErasDropdown: Dropdown;
    #iadsRangesDropdown: Dropdown;

    constructor(id: string) {
        super(id);

        this.#coalitionSwitch = new Switch("coalition-area-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(false);
        this.#iadsTypesDropdown = new Dropdown("iads-units-type-options", () => { });
        this.#iadsErasDropdown = new Dropdown("iads-era-options", () => {});
        this.#iadsRangesDropdown = new Dropdown("iads-range-options", () => {});
        this.#iadsDensitySlider = new Slider("iads-density-slider", 5, 100, "%", (value: number) => { });
        this.#iadsDistributionSlider = new Slider("iads-distribution-slider", 5, 100, "%", (value: number) => { });
        this.#iadsDensitySlider.setIncrement(5);
        this.#iadsDensitySlider.setValue(50);
        this.#iadsDensitySlider.setActive(true);
        this.#iadsDistributionSlider.setIncrement(5);
        this.#iadsDistributionSlider.setValue(50);
        this.#iadsDistributionSlider.setActive(true);

        document.addEventListener("coalitionAreaContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.showSubMenu(e.detail.type);
            else
                this.hideSubMenus();
        });

        document.addEventListener("coalitionAreaBringToBack", (e: any) => {
            if (this.#coalitionArea)
                getMap().bringCoalitionAreaToBack(this.#coalitionArea);
            getMap().hideCoalitionAreaContextMenu();
        });

        document.addEventListener("coalitionAreaDelete", (e: any) => {
            if (this.#coalitionArea)
                getMap().deleteCoalitionArea(this.#coalitionArea);
            getMap().hideCoalitionAreaContextMenu();
        });

        document.addEventListener("contextMenuCreateIads", (e: any) => {
            const area = this.getCoalitionArea();
            if (area)
                getUnitsManager().createIADS(area, this.#getCheckboxOptions(this.#iadsTypesDropdown), this.#getCheckboxOptions(this.#iadsErasDropdown), this.#getCheckboxOptions(this.#iadsRangesDropdown), this.#iadsDensitySlider.getValue(), this.#iadsDistributionSlider.getValue());
        })

        /* Create the checkboxes to select the unit roles */
        this.#iadsTypesDropdown.setOptionsElements(IADSTypes.map((role: string) => {
            return this.#createCheckboxOption(role);
        }));

        
        /* Create the checkboxes to select the unit periods */
        this.#iadsErasDropdown.setOptionsElements(groundUnitDatabase.getEras().map((era: string) => {
            return this.#createCheckboxOption(era);
        }));

        /* Create the checkboxes to select the unit ranges */
        this.#iadsRangesDropdown.setOptionsElements(groundUnitDatabase.getRanges().map((range: string) => {
            return this.#createCheckboxOption(range);
        }));

        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        super.show(x, y, latlng);
        if (getUnitsManager().getCommandMode() !== GAME_MASTER)
            this.#coalitionSwitch.hide()
    }

    showSubMenu(type: string) {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", type !== "iads");
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", type === "iads");
        this.clip();

        this.setVisibleSubMenu(type);
    }

    hideSubMenus() {
        this.getContainer()?.querySelector("#iads-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#iads-button")?.classList.toggle("is-open", false);
        this.clip();

        this.setVisibleSubMenu(null);
    }

    getCoalitionArea() {
        return this.#coalitionArea;
    }

    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => {
            element.setAttribute("data-coalition", this.getCoalitionArea()?.getCoalition())
        });
        this.#coalitionSwitch.setValue(this.getCoalitionArea()?.getCoalition() === "red");
    }

    #onSwitchClick(value: boolean) {
        if (getUnitsManager().getCommandMode() == GAME_MASTER) {
            this.getCoalitionArea()?.setCoalition(value ? "red" : "blue");
            this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => {
                element.setAttribute("data-coalition", this.getCoalitionArea()?.getCoalition())
            });
        }
    }

    #createCheckboxOption(text: string) {
        var div = document.createElement("div");
        div.classList.add("ol-checkbox");
        var label = document.createElement("label");
        label.title = `Add ${text}s to the IADS`;
        var input = document.createElement("input");
        input.type = "checkbox";
        input.checked = true;
        var span = document.createElement("span");
        span.innerText = text;
        label.appendChild(input);
        label.appendChild(span);
        div.appendChild(label);
        return div as HTMLElement;
    }

    #getCheckboxOptions(dropdown: Dropdown) {
        var values: { [key: string]: boolean } = {};
        const element = dropdown.getOptionElements();
        for (let idx = 0; idx < element.length; idx++) {
            const option = element.item(idx) as HTMLElement;
            const key = option.querySelector("span")?.innerText;
            const value = option.querySelector("input")?.checked;
            if (key !== undefined && value !== undefined)
                values[key] = value;
        }
        return values;
    }
}