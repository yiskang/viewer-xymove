/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Jaime Rosales 2016 - Forge Developer Partner Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////

import Client from '../Client';
import ModelTransformerExtension from '../../Viewing.Extension.ModelTransformer';
import EventTool from '../Viewer.EventTool/Viewer.EventTool'

var viewer;
var pointer;
var modelSide;

var getToken = { accessToken: Client.getaccesstoken()};
var pointData ={};

/// WHY I'M USING GLOBAL VARIABLES, SIMPLE I'M SETTING UP WITH REACT-SCRIPTS FOR EASIER 3RD PARTY DEVELOPER USE OF PROJECT
/// https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#using-global-variables

const Autodesk = window.Autodesk;
const THREE = window.THREE;


function launchViewer(documentId) {
 getToken.accessToken.then((token) => { 
    var options = {
            env: 'AutodeskProduction',
            accessToken: token.access_token
    };
    
    var viewerDiv = document.getElementById('viewerDiv');
    viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerDiv);

    Autodesk.Viewing.Initializer(options, function onInitialized(){
        var errorCode = viewer.start();

        // Check for initialization errors.
        if (errorCode) {
            console.error('viewer.start() error - errorCode:' + errorCode);
            return;
        }
            Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
        });
 })
}


/**
 * Autodesk.Viewing.Document.load() success callback.
 * Proceeds with model initialization.
 */
function onDocumentLoadSuccess(doc) {

    // A document contains references to 3D and 2D viewables.
    var viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {'type':'geometry'}, true);
    if (viewables.length === 0) {
        console.error('Document contains no viewables.');
        return;
    }

    var eventTool = new EventTool(viewer)
    eventTool.activate()
    eventTool.on('singleclick', (event) => {
        pointer = event
    })

    //load model.
    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onGeometryLoadedHandler);
    viewer.addEventListener(Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,onSelection);
    viewer.prefs.tag('ignore-producer');
    
    viewer.impl.disableRollover(true);
    viewer.loadExtension(ModelTransformerExtension, {
         parentControl: 'modelTools',
         autoLoad: true
    })  
    // Choose any of the available viewables.
    var indexViewable = 0;
    var lmvDoc = doc;

    // Everything is setup, load the model.
    loadModel(viewables, lmvDoc, indexViewable);
}

/**
* Autodesk.Viewing.Document.load() failuire callback.
**/
function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

//////////////////////////////////////////////////////////////////////////
// Model Geometry loaded callback
//
//////////////////////////////////////////////////////////////////////////
function onGeometryLoadedHandler(event) {
        event.target.model = event.model
        var viewer = event.target;
        viewer.removeEventListener(
                Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                onGeometryLoadedHandler);
        viewer.setQualityLevel(false,false);
        viewer.setGroundShadow(false);
        viewer.showAll();
        viewer.fitToView();
}


function loadNextModel(documentId, modelPosition ) {
     const extInstance = viewer.getExtension(ModelTransformerExtension);
     const pickVar = extInstance.panel;

     pickVar.tooltip.setContent(`
      <div id="pickTooltipId" class="pick-tooltip">
        <b>Pick position ...</b>
      </div>`, '#pickTooltipId')

    if (!pointData.point){
        alert('You need to select a point in your house to snap the AC first');
        pickVar.tooltip.activate();
    }
    else{
        modelSide = modelPosition;
        Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
        pickVar.tooltip.deactivate();
    }
   
}


function onSelection (event) {
    if (event.selections && event.selections.length) {
        pointData = viewer.clientToWorld(
            pointer.canvasX,
            pointer.canvasY,
            true)
    }
}

function serverTransform(){
   
        var transform = {
        translation: new THREE.Vector3(0.0, 0.0, 0.0),
        rotation: new THREE.Vector3(90.0, 0.0, 0.0),
        scale: new THREE.Vector3(0.003, 0.003, 0.003)
    }
        //console.log(transform);
        if (pointData.face.normal.x === 0 && pointData.face.normal.y === 0 ){
            transform.translation = new THREE.Vector3(pointData.point.x , pointData.point.y , pointData.point.z+2.5);
            console.log('Clipped to Floor Z axis');
        }
        else {
            alert('You need to select a point on the Floor');
        }
        return transform;
 
}



function serverTransformNext(translationValue, rotationValue, modelCode){
   
        var transform = {
            translation: translationValue,
            rotation: rotationValue,
            scale: new THREE.Vector3(0.003, 0.003, 0.003)
        }
        switch ( modelCode === "1" ) {
            case (transform.rotation.x === 90.0 && transform.rotation.y === 0.0  && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y + 4, transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 270.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x + 2 , transform.translation.y - 2 , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 90.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y - 2, transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 180.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x , transform.translation.y - 4 , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            default: 
                console.log('Enter an Angle equal to 0, 90, 180, 270 in the Y Axis');
        }


        switch ( modelCode === "2" ) {
            case (transform.rotation.x === 90.0 && transform.rotation.y === 0.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 270.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x + 2 , transform.translation.y - 2 , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 90.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y - 2, transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 180.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x , transform.translation.y , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            default: 
                console.log('Enter an Angle equal to 0, 90, 180, 270 in the Y Axis');
        }

        return transform;
 
}




function cabinetTransform(){
   
        var transform = {
        translation: new THREE.Vector3(0.0, 0.0, 0.0),
        rotation: new THREE.Vector3(0.0, 0.0, 0.0),
        scale: new THREE.Vector3(0.0025,0.0025,0.0025)
    }
        //console.log(transform);
        if (pointData.face.normal.x === 0 && pointData.face.normal.y === 0 ){
            transform.translation = new THREE.Vector3(pointData.point.x , pointData.point.y , pointData.point.z+1.25);
            console.log('Clipped to Floor Z axis');
        }
        else {
            alert('You need to select a point on the Floor');
        }
        return transform;
 
}

function cabinetTransformNext(translationValue, rotationValue, modelCode){
   
        var transform = {
            translation: translationValue,
            rotation: rotationValue,
            scale: new THREE.Vector3(0.0025,0.0025,0.0025)
        }
        switch ( modelCode === "1" ) {
            case (transform.rotation.x === 90.0 && transform.rotation.y === 0.0  && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y + 4, transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 270.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x + 2 , transform.translation.y - 2 , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 90.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y - 2, transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 180.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x , transform.translation.y - 4 , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            default: 
                console.log('Enter an Angle equal to 0, 90, 180, 270 in the Y Axis');
        }


        switch ( modelCode === "2" ) {
            case (transform.rotation.x === 90.0 && transform.rotation.y === 0.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 270.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x + 2 , transform.translation.y - 2 , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 90.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x - 2 , transform.translation.y - 2, transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            case (transform.rotation.x === 90.0 && transform.rotation.y === 180.0 && transform.rotation.z === 0.0):
                transform.translation = new THREE.Vector3(transform.translation.x , transform.translation.y , transform.translation.z);
                transform.rotation = new THREE.Vector3(transform.rotation.x , transform.rotation.y, transform.rotation.z);
                break;
            default: 
                console.log('Enter an Angle equal to 0, 90, 180, 270 in the Y Axis');
        }

        return transform;
 
}



function loadModel(viewables, lmvDoc, indexViewable) {

    return new Promise(async(resolve, reject)=> {
        var initialViewable = viewables[indexViewable];
        var svfUrl = lmvDoc.getViewablePath(initialViewable);
        var panel;
        var modelName;

        var modelOptions = {
                    sharedPropertyDbPath: lmvDoc.getPropertyDbPath(),
        };

        viewer.loadModel(svfUrl, modelOptions, (model) => {
            
            switch (lmvDoc.myData.status.toString() === "success" ) {
            case (lmvDoc.myData.guid.toString() === "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6dmlld2VyLXJvY2tzLXJlYWN0L3JhY2tfYXNzLmYzZA"):
                
                panel = viewer.getExtension(ModelTransformerExtension).panel;
                if (modelSide === '0'){
                    panel.setTransform(serverTransform());
                }
                else if (modelSide === '1')
                {
                    panel.setTransform(serverTransformNext(panel.getTranslation(), panel.getRotation(), modelSide));
                }
                else if (modelSide === '2')
                {
                    panel.setTransform(serverTransformNext(panel.getTranslation(), panel.getRotation(), modelSide));
                }
                panel.applyTransform(model);
                modelName = "serverRack.f3d"    
                break;
            case (lmvDoc.myData.guid.toString() === "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6dmlld2VyLXJvY2tzLXJlYWN0L0NhYmluZXQuemlw"):
                
                panel = viewer.getExtension(ModelTransformerExtension).panel;
                if (modelSide === '0'){
                    panel.setTransform(cabinetTransform());
                }
                else if (modelSide === '1')
                {
                    panel.setTransform(cabinetTransformNext(panel.getTranslation(), panel.getRotation(), modelSide));
                }
                else if (modelSide === '2')
                {
                    panel.setTransform(cabinetTransformNext(panel.getTranslation(), panel.getRotation(), modelSide));
                }
                panel.applyTransform(model); 
                modelName = "Cabinet.iam"
                break;
            default:
                modelName = "fabric.rvt";
            }

            model.name = modelName;
            resolve(model)
        })
    })
}


const Helpers = {
  launchViewer,
  loadNextModel
};

export default Helpers;