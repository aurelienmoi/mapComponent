const User = require('../Models/userModels.js'); // I used mongoose for my project, I cant post the who server side code as its used to a future production project, but you can get
                                                // the flow of this component below


module.exports = {


    async putCoordinates(req, res) {

        await User.updateOne({

            _id: req.decoded.id,
        },
            {
                geoJson: {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": req.body.coordinates
                            }
                        }
                    ]

                }
            }).then(() => {
                res.status(200).json({ message: "coordinates updated correctly" });
            }).catch(err => {
                res.status(500).json({ message: 'Error updating coordinates' })
            })

    },


    async getCoordinates(req, res) {



        User.find({}, { geoJson: 1, _id: 0 }).then(result => {


            let object1 = {
                "type": "FeatureCollection",
                "features": [
                    { "type": "Feature", "geometry": { "type": "Point", "coordinates": [12, 12] } }

                ]
            };

            object1.features.push(
                result[10].geoJson.features
            );

            console.log(object1.features);
            //console.log(result);
            if (object1.features[0]) {

                // console.log("ici le resullllllltaat",result)
                res.status(200).json({ result: result, object1: object1 });
            }

        })
            .catch(err => {

                res.status(500).json({ message: 'Error getting coordinates' })
            })





    }

}