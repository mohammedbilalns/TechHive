import Order from '../../model/orderModel.js';
import User from '../../model/userModel.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {log} from "mercedlogger"

const adminSalesreportController = {
  async renderSalesReport(req, res) {
    try {
      res.render('admin/salesreport', {
        page: "salesreport"  // For active sidebar menu highlighting
      });
    } catch (error) {
      log.red('ERROR_RENDERING_SALES_REPORT_PAGE', error);
      res.status(500).send('Error loading sales report page');
    }
  },

  async getSalesReportData(req, res) {
    try {
      const { filterType, startDate, endDate } = req.query;
      let dateFilter = {};

      // Set date filter based on filter type
      switch (filterType) {
        case 'daily':
          dateFilter = {
            orderDate: {
              $gte: new Date(new Date().setHours(0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59))
            }
          };
          break;
        case 'weekly':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          dateFilter = {
            orderDate: {
              $gte: new Date(weekStart.setHours(0, 0, 0)),
              $lt: new Date()
            }
          };
          break;
        case 'monthly':
          const monthStart = new Date();
          monthStart.setDate(1);
          dateFilter = {
            orderDate: {
              $gte: new Date(monthStart.setHours(0, 0, 0)),
              $lt: new Date()
            }
          };
          break;
        case 'yearly':
          const yearStart = new Date(new Date().getFullYear(), 0, 1);
          dateFilter = {
            orderDate: {
              $gte: new Date(yearStart.setHours(0, 0, 0)),
              $lt: new Date()
            }
          };
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              orderDate: {
                $gte: new Date(startDate),
                $lt: new Date(new Date(endDate).setHours(23, 59, 59))
              }
            };
          }
          break;
      }

      // Fetch orders with date filter
      const orders = await Order.find(dateFilter)
        .populate('userId', 'fullname')
        .sort({ orderDate: -1 });

      // Calculate summary
      let totalSales = 0;
      let totalDiscounts = 0;

      const formattedOrders = await Promise.all(orders.map(order => {
        const discount = (order.coupon?.discount || 0);
        totalSales += order.totalAmount;
        totalDiscounts += discount;

        return {
          orderId: order.orderId,
          orderDate: order.orderDate,
          customer: order.userId.fullname,
          itemCount: order.items.length,
          totalAmount: order.totalAmount + discount,
          discount: discount,
          netAmount: order.totalAmount
        };
      }));

      res.json({
        totalOrders: orders.length,
        totalSales: totalSales + totalDiscounts,
        totalDiscounts,
        netRevenue: totalSales,
        orders: formattedOrders
      });

    } catch (error) {
      log.red('ERROR_GENERATING_SALES_REPORT_DATA', error);
      res.status(500).json({ message: 'Failed to generate sales report' });
    }
  },

  async downloadReport(req, res) {
    try {
      const { format, filterType, startDate, endDate } = req.query;
      let dateFilter = {};

      // Set date filter based on filter type (same logic as getSalesReportData)
      switch (filterType) {
        case 'daily':
          dateFilter = {
            orderDate: {
              $gte: new Date(new Date().setHours(0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59))
            }
          };
          break;
        case 'weekly':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          dateFilter = {
            orderDate: {
              $gte: new Date(weekStart.setHours(0, 0, 0)),
              $lt: new Date()
            }
          };
          break;
        case 'monthly':
          const monthStart = new Date();
          monthStart.setDate(1);
          dateFilter = {
            orderDate: {
              $gte: new Date(monthStart.setHours(0, 0, 0)),
              $lt: new Date()
            }
          };
          break;
        case 'yearly':
          const yearStart = new Date(new Date().getFullYear(), 0, 1);
          dateFilter = {
            orderDate: {
              $gte: new Date(yearStart.setHours(0, 0, 0)),
              $lt: new Date()
            }
          };
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              orderDate: {
                $gte: new Date(startDate),
                $lt: new Date(new Date(endDate).setHours(23, 59, 59))
              }
            };
          }
          break;
      }

      // Fetch orders
      const orders = await Order.find(dateFilter)
        .populate('userId', 'fullname')
        .sort({ orderDate: -1 });

      // Format orders data
      const formattedOrders = orders.map(order => ({
        orderId: order.orderId,
        orderDate: order.orderDate,
        customer: order.userId.fullname,
        itemCount: order.items.length,
        totalAmount: order.totalAmount + (order.coupon?.discount || 0),
        discount: order.coupon?.discount || 0,
        netAmount: order.totalAmount
      }));

      // Calculate totals
      const totals = formattedOrders.reduce((acc, order) => ({
        totalOrders: acc.totalOrders + 1,
        totalAmount: acc.totalAmount + order.totalAmount,
        totalDiscounts: acc.totalDiscounts + order.discount,
        netAmount: acc.netAmount + order.netAmount
      }), { totalOrders: 0, totalAmount: 0, totalDiscounts: 0, netAmount: 0 });

      if (format === 'excel') {
        await generateExcelReport(res, formattedOrders, totals, filterType);
      } else if (format === 'pdf') {
        await generatePDFReport(res, formattedOrders, totals, filterType);
      }

    } catch (error) {
      log.red('ERROR_DOWNLOADING_SALES_REPORT', error);
      res.status(500).json({ message: 'Failed to download report' });
    }
  }
};

async function generateExcelReport(res, orders, totals, filterType) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  // Add title
  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = `TechHive - Sales Report - ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Add headers
  worksheet.addRow(['']);  // Empty row for spacing
  const headers = [
    'Order ID',
    'Date',
    'Customer',
    'Items',
    'Total Amount (₹)',
    'Discount (₹)',
    'Net Amount (₹)'
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };

  // Add data rows
  orders.forEach(order => {
    worksheet.addRow([
      order.orderId,
      new Date(order.orderDate).toLocaleDateString(),
      order.customer,
      order.itemCount,
      order.totalAmount,
      order.discount,
      order.netAmount
    ]);
  });

  // Add totals
  worksheet.addRow(['']);  // Empty row for spacing
  worksheet.addRow([
    'TOTALS',
    '',
    '',
    totals.totalOrders,
    totals.totalAmount,
    totals.totalDiscounts,
    totals.netAmount
  ]).font = { bold: true };

  // Style the worksheet
  worksheet.columns.forEach(column => {
    column.width = 15;
    column.alignment = { horizontal: 'left' };
  });

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=sales-report-${filterType}-${new Date().toISOString().split('T')[0]}.xlsx`
  );

  // Write to response
  await workbook.xlsx.write(res);
}

async function generatePDFReport(res, orders, totals, filterType) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition', 
    `attachment; filename=sales-report-${filterType}-${new Date().toISOString().split('T')[0]}.pdf`
  );

  // Pipe the PDF to the response
  doc.pipe(res);

  // Add title
  doc.fontSize(20)
     .text(`Sales Report - ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`, { align: 'center' })
     .moveDown(2);

  // Define table layout
  const tableTop = 150;
  const columnSpacing = 80;
  const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Discount', 'Net'];

  // Add headers
  headers.forEach((header, i) => {
    doc.fontSize(10)
       .text(header, 30 + (i * columnSpacing), tableTop, { width: columnSpacing, align: 'left' });
  });

  // Add rows
  let yPosition = tableTop + 25;
  orders.forEach((order, index) => {
    if (yPosition > 700) {  // Check if we need a new page
      doc.addPage();
      yPosition = 50;
      // Add headers to new page
      headers.forEach((header, i) => {
        doc.fontSize(10)
           .text(header, 30 + (i * columnSpacing), yPosition, { width: columnSpacing, align: 'left' });
      });
      yPosition += 25;
    }

    const row = [
      order.orderId,
      new Date(order.orderDate).toLocaleDateString(),
      order.customer,
      order.itemCount,
      `₹${order.totalAmount.toFixed(2)}`,
      `₹${order.discount.toFixed(2)}`,
      `₹${order.netAmount.toFixed(2)}`
    ];

    row.forEach((text, i) => {
      doc.fontSize(8)
         .text(text.toString(), 30 + (i * columnSpacing), yPosition, { 
           width: columnSpacing, 
           align: 'left' 
         });
    });

    yPosition += 20;
  });

  // Add totals
  yPosition += 20;
  doc.fontSize(10)
     .text('TOTALS', 30, yPosition)
     .text(`Orders: ${totals.totalOrders}`, 30 + (3 * columnSpacing), yPosition)
     .text(`₹${totals.totalAmount.toFixed(2)}`, 30 + (4 * columnSpacing), yPosition)
     .text(`₹${totals.totalDiscounts.toFixed(2)}`, 30 + (5 * columnSpacing), yPosition)
     .text(`₹${totals.netAmount.toFixed(2)}`, 30 + (6 * columnSpacing), yPosition);

  // Finalize PDF
  doc.end();
}

export default adminSalesreportController;
