import { Map } from "./map/map"
import { UnitsManager } from "./units/unitsmanager";
import { UnitInfoPanel } from "./panels/unitinfopanel";
import { ContextMenu } from "./controls/contextmenu";
import { ConnectionStatusPanel } from "./panels/connectionstatuspanel";
import { MissionHandler } from "./missionhandler/missionhandler";
import { UnitControlPanel } from "./panels/unitcontrolpanel";
import { MouseInfoPanel } from "./panels/mouseinfopanel";
import { AIC } from "./aic/aic";
import { ATC } from "./atc/ATC";
import { FeatureSwitches } from "./FeatureSwitches";
import { LogPanel } from "./panels/logpanel";
import { getAirbases, getBulllseye as getBulllseyes, getUnits } from "./server/server";

var map: Map;
var contextMenu: ContextMenu;

var unitsManager: UnitsManager;
var missionHandler: MissionHandler;
 
var aic: AIC;
var atc: ATC;

var unitInfoPanel: UnitInfoPanel;
var connectionStatusPanel: ConnectionStatusPanel;
var unitControlPanel: UnitControlPanel;
var mouseInfoPanel: MouseInfoPanel;
var logPanel: LogPanel;

var connected: boolean = false;
var activeCoalition: string = "blue";

var sessionHash: string | null = null;

var featureSwitches;

function setup() {

    featureSwitches = new FeatureSwitches();

    /* Initialize */
    map = new Map('map-container');
    unitsManager = new UnitsManager();
    missionHandler = new MissionHandler();

    contextMenu = new ContextMenu("contextmenu");
   
    //unitInfoPanel = new UnitInfoPanel("unit-info-panel");
    unitControlPanel = new UnitControlPanel("unit-control-panel");
    connectionStatusPanel = new ConnectionStatusPanel("connection-status-panel");
    mouseInfoPanel = new MouseInfoPanel("mouse-info-panel");
    //logPanel = new LogPanel("log-panel");

    missionHandler = new MissionHandler();

    /* AIC */
    let aicFeatureSwitch = featureSwitches.getSwitch( "aic" );
    if ( aicFeatureSwitch?.isEnabled() ) {
        aic = new AIC();
        // TODO: add back buttons
    }

    /* Generic clicks */
    document.addEventListener( "click", ( ev ) => {

        if ( ev instanceof PointerEvent && ev.target instanceof HTMLElement ) {

            const target = ev.target;

            if ( target.classList.contains( "olympus-dialog-close" ) ) {
                target.closest( "div.olympus-dialog" )?.classList.add( "hide" );
            }

            const triggerElement = target.closest( "[data-on-click]" );
 
            if ( triggerElement instanceof HTMLElement ) {
                const eventName:string = triggerElement.dataset.onClick || "";
                const params:string    = triggerElement.dataset.onClickParams || "{}";

                if ( eventName ) {
                    document.dispatchEvent( new CustomEvent( eventName, {
                        detail: JSON.parse( params )
                    } ) );
                }
                
            }

        }
        
    });


    /* Keyup events */
    document.addEventListener( "keyup", ev => {

        switch( ev.code ) {
            case "KeyL":
                document.body.toggleAttribute( "data-hide-labels" );
                break;
        }

    });


    document.addEventListener( "toggleCoalitionVisibility", ( ev:CustomEventInit ) => {
        document.body.toggleAttribute( "data-hide-" + ev.detail.coalition );
    });

    document.addEventListener( "toggleUnitVisibility", ( ev:CustomEventInit ) => {
        document.body.toggleAttribute( "data-hide-" + ev.detail.unitType );
    });


    /**  Olympus UI ***/
    document.querySelectorAll( ".ol-select" ).forEach( select => {

        //  Do open/close toggle
        select.addEventListener( "click", ev => {
            ev.preventDefault();
            ev.stopPropagation();
            select.classList.toggle( "is-open" );
        });

        //  Autoclose on mouseleave
        select.addEventListener( "mouseleave", ev => {
            select.classList.remove( "is-open" );
        });

    });


    /* ATC */
    let atcFeatureSwitch = featureSwitches.getSwitch( "atc" );
    if ( atcFeatureSwitch?.isEnabled() ) {
        atc = new ATC();
        // TODO: add back buttons
    }

    /* On the first connection, force request of full data */
    getAirbases((data: AirbasesData) => getMissionData()?.update(data));
    getBulllseyes((data: BullseyesData) => getMissionData()?.update(data));
    getUnits((data: UnitsData) => getUnitsManager()?.update(data), true /* Does a full refresh */);
    
    /* Start periodically requesting updates */
    startPeriodicUpdate();
}

function startPeriodicUpdate()
{
    requestUpdate();
    requestRefresh();
}

function requestUpdate() {
    /* Main update rate = 250ms is minimum time, equal to server update time. */
    getUnits((data: UnitsData) => {
        getUnitsManager()?.update(data);
        checkSessionHash(data.sessionHash);
    }, false);
    setTimeout(() => requestUpdate(), getConnected() ? 250 : 1000);

    getConnectionStatusPanel()?.update(getConnected());
}

function requestRefresh() {
    /* Main refresh rate = 5000ms. */
    getUnits((data: UnitsData) => {
        getAirbases((data: AirbasesData) => getMissionData()?.update(data));
        getBulllseyes((data: BullseyesData) => getMissionData()?.update(data));
        checkSessionHash(data.sessionHash);
    }, true);
    setTimeout(() => requestRefresh(), 5000);
}

function checkSessionHash(newSessionHash: string)
{
    if (sessionHash != null)
    {
        if (newSessionHash != sessionHash)
            location.reload();
    }
    else
        sessionHash = newSessionHash;
}

export function getMap() {
    return map;
}

export function getMissionData() {
    return missionHandler;
}

export function getContextMenu() {
    return contextMenu;
}

export function getUnitsManager() {
    return unitsManager;
}

export function getUnitInfoPanel() {
    return unitInfoPanel;
}

export function getUnitControlPanel() {
    return unitControlPanel;
}

export function getMouseInfoPanel() {
    return mouseInfoPanel;
}

export function getLogPanel() {
    return logPanel;
}

export function getConnectionStatusPanel() {
    return connectionStatusPanel;
}

export function setActiveCoalition(newActiveCoalition: string) {
    activeCoalition = newActiveCoalition;
}

export function getActiveCoalition() {
    return activeCoalition;
}

export function setConnected(newConnected: boolean) {
    connected = newConnected
}

export function getConnected() {
    return connected;
}

window.onload = setup;