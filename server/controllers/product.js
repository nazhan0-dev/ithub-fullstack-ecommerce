const prisma = require('../config/prisma')
const cloudinary = require( 'cloudinary').v2;

exports.create = async(req,res) =>{
    try {
        const {title , description , price , quantity , categoryId , images} = req.body
        const  product = await prisma.product.create({
            data :{
                title : title,
                description : description,
                price : parseFloat(price) ,
                quantity : parseInt(quantity),
                categoryId : parseInt(categoryId),
                images : {
                    create : images.map((item)=> ({
                        asset_id   : item.aseset_id || "",
                        public_id  : item.public_id,
                        url        : item.url,
                        secure_url : item.secure_url
                    }))
                }
            }
        })
        res.send(product)
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}
exports.list = async(req,res) =>{
    try {
        const {count} = req.params
        const products = await prisma.product.findMany({
            // ระบุจำนวนที่จะ list
            take : parseInt(count),
            // เรียงสินค้า เพิ่มล่าสุดอยู่บน
            orderBy : {createdAt : "desc"},
            include : {
                category : true,
                images : true
            }
        
        })
        res.send(products)
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}
exports.read = async(req,res) =>{
    try {
        const {id} = req.params
        const products = await prisma.product.findFirst({
            // ระบุจำนวนที่จะ list
            where : {
                id : Number(id)
            },
            include : {
                category : true,
                images : true
            }
        
        })
        res.send(products)
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}
exports.update = async(req,res) =>{
    try {     
        const {id} = req.params
        const {title , description , price , quantity , categoryId , images} = req.body
        //   clear foto
        await prisma.image.deleteMany({
            where : {
                productId : Number(id)
            }
        })
       
        
        const  product = await prisma.product.update({
            where :{
                id : Number(id)
            },
            data :{
                title : title,
                description : description,
                price : parseFloat(price) ,
                quantity : parseInt(quantity),
                categoryId : parseInt(categoryId),
                images : {
                    create : images.map((item)=> ({
                        asset_id   : item.aseset_id,
                        public_id  : item.public_id,
                        url        : item.url,
                        secure_url : item.secure_url
                    }))
                }
            }
        })
        res.send(product)
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}
exports.remove = async(req,res) =>{
    try {
        const {id} = req.params
        // เดี่ยวมา
        await prisma.product.delete({
            where : {
                id : Number(id)
            }
        })
        res.send('Delete Success !!')
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}
exports.listby = async(req,res) =>{
    try {
        const {sort , order , limit} = req.body
        console.log(sort , order , limit)
        const products = await prisma.product.findMany({
            take : limit,
            orderBy : {[sort] : order},
            include : {category : true}
        })
        res.send(products)
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}

const handleQuery = async(req,res,query) =>{
    try {
        const products  = await prisma.product.findMany({
            where : {
                title : {
                    contains : query,
                }
            },
            include : {
                category : true,
                images : true
            }
        })
        res.send(products)
        
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Search Error'})
    }
}

const handlePrice = async(req,res,priceRange) =>{
   try {
     const products = await prisma.product.findMany({
        where : {
            price : {
                gte : priceRange[0],
                lte : priceRange[1]
            }
        },
        include : {
             category : true,
             images : true
        }
     })
     res.send(products)   } catch (error) {
     console.log(error)
     res.status(500).json({message : 'Server Error'})
   }
}

const handleCategory = async(req,res,categoryId) =>{
    try {
        const products = await prisma.product.findMany({
            where : {
                categoryId : {
                     in : categoryId.map((id)=>Number(id))
                }
            },
            include : {
                category : true,
                images : true
            }
        })
        res.send(products)
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}



exports.searchFilters = async(req,res) =>{
    try {
        const {query , category , price} = req.body

        if(query){
            console.log('query --->',query)
            await handleQuery(req,res,query)
        }
        if(category){
            console.log('category --->',category)
            await handleCategory(req,res,category)
        }
        if(price){
            console.log('price --->',price)
            await handlePrice(req,res,price)
        }
        // res.send('Hello Search Filters Prouct')
    } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
    }
}

cloudinary.config({
     cloud_name: process.env.CLOUNDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUNDINARY_API_KEY, 
    api_secret: process.env.CLOUNDINARY_API_SECRET
});


exports.createImages = async(req,res) =>{
     try {
        // console.log(req.body)
        const result = await cloudinary.uploader.upload(req.body.image,{
            public_id : `${Date.now()}`,
            resource_type : 'auto',
            folder : 'Ecom'
        })
        res.send(result)
     } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
     }
}
exports.removeImage = async(req,res) =>{
     try {
        res.send('Hello Remove Imge')
     } catch (error) {
        console.log(error)
        res.status(500).json({message : 'Server Error'})
     }
}