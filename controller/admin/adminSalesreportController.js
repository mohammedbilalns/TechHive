import Order from '../../model/orderModel.js';
import User from '../../model/userModel.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { log } from "mercedlogger"


const renderSalesReport = async (req, res) => {
  try {
    res.render('admin/salesreport', {
      page: "salesreport"
    });
  } catch (error) {
    log.red('ERROR_RENDERING_SALES_REPORT_PAGE', error);
    res.status(500).send('Error loading sales report page');
  }
};

const getSalesReportData = async (req, res) => {
  try {
    const { filterType, startDate, endDate } = req.query;

    //  date validation for custom range
    if (filterType === 'custom') {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
      }

      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      if (startDateTime > endDateTime) {
        return res.status(400).json({
          message: 'Invalid date range: Start date cannot be after end date'
        });
      }
    }

    let dateFilter = {};

    //  date filter based on filter type
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

    // Add delivered status to the filter
    dateFilter.status = 'Delivered'; // Only include delivered orders
    dateFilter.isReturned = { $ne: true }; // Exclude returned orders

    // Modify the query to find orders with at least one delivered item
    const orders = await Order.find({
      'items.status': 'delivered',  // At least one item is delivered
      orderDate: dateFilter.orderDate // Keep existing date filter
    })
      .populate('userId', 'fullname')
      .sort({ orderDate: -1 });

    // Calculate summary
    let totalSales = 0;
    let totalDiscounts = 0;

    const formattedOrders = await Promise.all(orders.map(order => {
      // Filter only delivered items
      const deliveredItems = order.items.filter(item => item.status === 'delivered');
      
      // Skip orders with no delivered items
      if (deliveredItems.length === 0) return null;

      // Calculate amounts only for delivered items
      const itemTotals = deliveredItems.reduce((acc, item) => {
        const itemOriginalAmount = item.price * item.quantity;
        const itemDiscountAmount = (item.price * (item.discount / 100)) * item.quantity;
        
        acc.originalAmount += itemOriginalAmount;
        acc.offerDiscount += itemDiscountAmount;
        return acc;
      }, { originalAmount: 0, offerDiscount: 0 });

      // Calculate coupon discount proportionally for delivered items
      const orderTotalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveredItemsRatio = itemTotals.originalAmount / orderTotalAmount;
      const couponDiscount = order.coupon?.discount 
        ? (order.coupon.discount * deliveredItemsRatio) 
        : 0;

      const totalDiscount = couponDiscount + itemTotals.offerDiscount;
      const netAmount = itemTotals.originalAmount - totalDiscount;

      totalSales += itemTotals.originalAmount;
      totalDiscounts += totalDiscount;

      return {
        orderId: order.orderId,
        orderDate: order.orderDate,
        customer: order.userId.fullname,
        itemCount: deliveredItems.length,
        totalAmount: itemTotals.originalAmount,
        discount: {
          coupon: couponDiscount,
          offer: itemTotals.offerDiscount,
          total: totalDiscount
        },
        netAmount: netAmount
      };
    }));

    // Filter out null values (orders with no delivered items)
    const validOrders = formattedOrders.filter(order => order !== null);

    res.json({
      totalOrders: validOrders.length,
      totalSales,
      totalDiscounts,
      netRevenue: totalSales - totalDiscounts,
      orders: validOrders
    });

  } catch (error) {
    log.red('Sales report error:', error);
    res.status(500).json({ message: 'Failed to generate sales report' });
  }
};

const getFormattedDateRange = (filterType, startDate, endDate) => {
  const today = new Date();

  switch (filterType) {
    case 'daily':
      return `Date: ${today.toLocaleDateString()}`;
    case 'weekly':
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return `Week: ${weekStart.toLocaleDateString()} - ${today.toLocaleDateString()}`;
    case 'monthly':
      return `Month: ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    case 'yearly':
      return `Year: ${today.getFullYear()}`;
    case 'custom':
      return `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    default:
      return '';
  }
};

const generateExcelReport = async (res, orders, totals, filterType, startDate, endDate) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  // Add title and date range
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = 'Sales Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Add date range
  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = getFormattedDateRange(filterType, startDate, endDate);
  worksheet.getCell('A2').font = { size: 12, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Add generated date
  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').value = `Generated on: ${new Date().toLocaleString()}`;
  worksheet.getCell('A3').font = { size: 10, italic: true };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

  worksheet.addRow(['']);  // Empty row for spacing
  const headers = [
    'Order ID',
    'Date',
    'Customer',
    'Items',
    'Total Amount (₹)',
    'Coupon Discount (₹)',
    'Offer Discount (₹)',
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
      order.totalAmount.toFixed(2),
      order.couponDiscount.toFixed(2),
      order.offerDiscount.toFixed(2),
      order.netAmount.toFixed(2)
    ]);
  });

  // Add totals
  worksheet.addRow(['']);  // Empty row for spacing
  worksheet.addRow([
    'TOTALS',
    '',
    '',
    totals.totalOrders,
    totals.totalAmount.toFixed(2),
    totals.totalCouponDiscounts.toFixed(2),
    totals.totalOfferDiscounts.toFixed(2),
    totals.netAmount.toFixed(2)
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
};

const generatePDFReport = async (res, orders, totals, filterType, startDate, endDate) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });


  doc.registerFont('NotoSans', 'static/fonts/NotoSans-Regular.ttf');
  doc.registerFont('NotoSans-Bold', 'static/fonts/NotoSans-Bold.ttf');
  doc.registerFont('NotoSans-Italic', 'static/fonts/NotoSans-Italic.ttf');

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=sales-report-${filterType}-${new Date().toISOString().split('T')[0]}.pdf`
  );

  doc.pipe(res);

  // Title Section
  doc.fontSize(24)
    .font('NotoSans-Bold')
    .text('Sales Report - TechHive', 40, 40, { align: 'center' })
    .moveDown(0.5);

  // Date Range Section
  doc.fontSize(14)
    .font('NotoSans')
    .text(getFormattedDateRange(filterType, startDate, endDate), { align: 'center' })
    .moveDown(0.5);

  // Generated Date
  doc.fontSize(10)
    .font('NotoSans-Italic')
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
    .moveDown(2);

  // Summary Cards Section - Adjusted widths and spacing
  const summaryStartY = doc.y;
  const cardWidth = 120;  // Reduced from 130
  const cardSpacing = 10; // Reduced from 15
  const cardHeight = 70;

  // Helper function to draw a card with text truncation
  const drawCard = (x, y, title, value, color) => {
    doc.roundedRect(x, y, cardWidth, cardHeight, 5)
      .fill(color)
      .fillColor('#000000');

    doc.fontSize(10)
      .font('NotoSans')
      .text(title, x + 10, y + 10, {
        width: cardWidth - 20,
        ellipsis: true
      });

    doc.fontSize(16)
      .font('NotoSans-Bold')
      .text(value, x + 10, y + 35, {
        width: cardWidth - 20,
        ellipsis: true
      });
  };

  //  summary cards with adjusted spacing
  drawCard(40, summaryStartY, 'Total Orders', totals.totalOrders.toString(), '#EBF5FF');
  drawCard(40 + cardWidth + cardSpacing, summaryStartY, 'Total Sales', `₹${totals.totalAmount.toFixed(2)}`, '#F0FDF4');
  drawCard(40 + (cardWidth + cardSpacing) * 2, summaryStartY, 'Total Discounts', `₹${totals.totalDiscounts.toFixed(2)}`, '#F5F3FF');
  drawCard(40 + (cardWidth + cardSpacing) * 3, summaryStartY, 'Net Revenue', `₹${totals.netAmount.toFixed(2)}`, '#FEF9C3');

  doc.moveDown(4);

  // Table Headers
  const tableTop = doc.y + 20;
  const tableLeftMargin = 50;

  const columns = [
    { header: 'Order ID', width: 62 },
    { header: 'Date', width: 62 },
    { header: 'Customer', width: 85 },
    { header: 'Items', width: 35 },
    { header: 'Total', width: 55 },
    { header: 'Coupon', width: 50 },
    { header: 'Offer', width: 50 },
    { header: 'Net', width: 50 }
  ];

  // Calculate total width
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // Draw table border
  doc.rect(tableLeftMargin, tableTop - 10, totalWidth, 40).fill('#F3F4F6');

  // Draw table header 
  let xPos = tableLeftMargin;
  doc.font('NotoSans-Bold')
    .fontSize(9)
    .fillColor('#1F2937');

  columns.forEach(column => {
    doc.text(column.header, xPos, tableTop, {
      width: column.width,
      align: 'center'
    });
    xPos += column.width;
  });

  // Draw header bottom border 
  doc.moveTo(tableLeftMargin, tableTop + 25)
    .lineTo(tableLeftMargin + totalWidth, tableTop + 25)
    .strokeColor('#D1D5DB')
    .lineWidth(1.5)
    .stroke();

  // Table Rows
  let yPos = tableTop + 35;
  doc.font('NotoSans').fontSize(8);

  orders.forEach((order, index) => {
    // Add new page if needed
    if (yPos > 680) {
      doc.addPage();
      yPos = 50;

      // Redraw headers on new page 
      doc.rect(tableLeftMargin, yPos - 10, totalWidth, 40).fill('#F3F4F6');

      xPos = tableLeftMargin;
      doc.font('NotoSans-Bold')
        .fontSize(9)
        .fillColor('#1F2937');

      columns.forEach(column => {
        doc.text(column.header, xPos, yPos, {
          width: column.width,
          align: 'center'
        });
        xPos += column.width;
      });

      doc.moveTo(tableLeftMargin, yPos + 25)
        .lineTo(tableLeftMargin + totalWidth, yPos + 25)
        .strokeColor('#D1D5DB')
        .lineWidth(1.5)
        .stroke();

      yPos += 35;
      doc.font('NotoSans').fontSize(8);
    }

    // Alternate row background with border
    doc.rect(tableLeftMargin, yPos - 5, totalWidth, 30)
      .fill(index % 2 === 0 ? '#FFFFFF' : '#F9FAFB');

    // Draw light vertical lines for columns 
    xPos = tableLeftMargin;
    columns.forEach(column => {
      doc.moveTo(xPos, yPos - 5)
        .lineTo(xPos, yPos + 25)
        .strokeColor('#E5E7EB')
        .lineWidth(0.5)
        .stroke();
      xPos += column.width;
    });

    // Draw last vertical line 
    doc.moveTo(tableLeftMargin + totalWidth, yPos - 5)
      .lineTo(tableLeftMargin + totalWidth, yPos + 25)
      .stroke();

    // Draw row data 
    xPos = tableLeftMargin;
    doc.fillColor('#000000');

    const rowData = [
      { text: order.orderId, align: 'left' },
      { text: new Date(order.orderDate).toLocaleDateString(), align: 'left' },
      { text: order.customer, align: 'left' },
      { text: order.itemCount.toString(), align: 'center' },
      { text: `₹${order.totalAmount.toFixed(2)}`, align: 'right' },
      { text: `₹${order.couponDiscount.toFixed(2)}`, align: 'right' },
      { text: `₹${order.offerDiscount.toFixed(2)}`, align: 'right' },
      { text: `₹${order.netAmount.toFixed(2)}`, align: 'right' }
    ];

    rowData.forEach((data, i) => {
      const column = columns[i];
      const textOptions = {
        width: column.width - 8,
        height: 30,
        align: data.align,
        ellipsis: true,
        lineGap: 2
      };

      const textX = xPos + (data.align === 'right' ? 4 : 4);
      doc.text(data.text, textX, yPos, textOptions);
      xPos += column.width;
    });

    yPos += 30;
  });

  // Draw bottom border of the table 
  doc.moveTo(tableLeftMargin, yPos - 5)
    .lineTo(tableLeftMargin + totalWidth, yPos - 5)
    .strokeColor('#D1D5DB')
    .lineWidth(1.5)
    .stroke();

  // Totals section with improved design and adjusted positioning
  const totalsY = yPos + 10;

  // Draw totals box with adjusted width
  const totalsBoxWidth = 490;
  doc.rect(40, totalsY, totalsBoxWidth, 120)
    .fill('#F8FAFC');

  // Add totals with adjusted positioning and width
  const addTotalLine = (label, value, lineY) => {
    doc.font('NotoSans-Bold')
      .fontSize(10)
      .fillColor('#1F2937')
      .text(label, 60, lineY, { width: 180, align: 'left' })
      .text(value, 240, lineY, { width: 250, align: 'right' });
  };

  addTotalLine('Total Number of Orders:', totals.totalOrders.toString(), totalsY + 15);
  addTotalLine('Total Sales Amount:', `₹${totals.totalAmount.toFixed(2)}`, totalsY + 40);
  addTotalLine('Total Discounts Applied:', `₹${totals.totalDiscounts.toFixed(2)}`, totalsY + 65);

  // Net Revenue with highlighted background and adjusted width
  doc.rect(40, totalsY + 90, totalsBoxWidth, 30)
    .fill('#E0E7FF');
  addTotalLine('Net Revenue:', `₹${totals.netAmount.toFixed(2)}`, totalsY + 95);

  // Footer
  doc.fontSize(8)
    .font('NotoSans-Italic')
    .fillColor('#6B7280')
    .text(
      'This is a computer generated report.',
      40,
      doc.page.height - 40,
      { align: 'center' }
    );

  doc.end();
};

const downloadReport = async (req, res) => {
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

    // Add delivered status to the filter
    dateFilter.status = 'Delivered'; // Only include delivered orders
    dateFilter.isReturned = { $ne: true }; // Exclude returned orders

    // Fetch orders with date and status filter
    const orders = await Order.find(dateFilter)
      .populate('userId', 'fullname')
      .sort({ orderDate: -1 });

    const formattedOrders = orders.map(order => {
      const couponDiscount = order.coupon?.discount || 0;
      const offerDiscount = order.items.reduce((total, item) => {
        // Calculate discount amount for each item based on percentage
        const itemDiscountAmount = (item.price * (item.discount / 100)) * item.quantity;
        return total + itemDiscountAmount;
      }, 0);
      const totalDiscount = couponDiscount + offerDiscount;

      return {
        orderId: order.orderId,
        orderDate: order.orderDate,
        customer: order.userId.fullname,
        itemCount: order.items.length,
        totalAmount: order.totalAmount + totalDiscount,
        couponDiscount: couponDiscount,
        offerDiscount: offerDiscount,
        totalDiscount: totalDiscount,
        netAmount: order.totalAmount
      };
    });

    // Calculate totals
    const totals = formattedOrders.reduce((acc, order) => ({
      totalOrders: acc.totalOrders + 1,
      totalAmount: acc.totalAmount + order.totalAmount,
      totalCouponDiscounts: acc.totalCouponDiscounts + order.couponDiscount,
      totalOfferDiscounts: acc.totalOfferDiscounts + order.offerDiscount,
      totalDiscounts: acc.totalDiscounts + order.totalDiscount,
      netAmount: acc.netAmount + order.netAmount
    }), {
      totalOrders: 0,
      totalAmount: 0,
      totalCouponDiscounts: 0,
      totalOfferDiscounts: 0,
      totalDiscounts: 0,
      netAmount: 0
    });

    if (format === 'excel') {
      const fileName = `sales-report-${filterType}-${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${fileName}`
      );

      await generateExcelReport(res, formattedOrders, totals, filterType, startDate, endDate);
    } else if (format === 'pdf') {
      await generatePDFReport(res, formattedOrders, totals, filterType, startDate, endDate);
    }

  } catch (error) {
    log.red('DOWNLOAD_REPORT_ERROR', error);
    res.status(500).json({ message: 'Failed to download report' });
  }
};

export default {
  renderSalesReport,
  getSalesReportData,
  downloadReport,
  generateExcelReport,
  generatePDFReport
};