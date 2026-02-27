// Script to seed activities from CSV
// Run this after deploying the import-activities edge function

const SUPABASE_URL = "https://frxmtugxtusqbtnmddtu.supabase.co";
const BATCH_SIZE = 500;

async function seedActivities() {
  // Read the CSV file
  const csvContent = await Deno.readTextFile("./sydney_activities_thousands.csv");
  const lines = csvContent.trim().split("\n");
  
  console.log(`Total lines: ${lines.length}`);
  
  // Process in batches
  const header = lines[0];
  const totalBatches = Math.ceil((lines.length - 1) / BATCH_SIZE);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * BATCH_SIZE + 1;
    const end = Math.min(start + BATCH_SIZE, lines.length);
    const batchLines = [header, ...lines.slice(start, end)];
    
    console.log(`Processing batch ${batch + 1}/${totalBatches} (lines ${start}-${end})`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        csvData: batchLines.join("\n"),
        batchNumber: batch + 1,
        batchSize: BATCH_SIZE,
      }),
    });
    
    const result = await response.json();
    console.log(`Batch ${batch + 1} result:`, result);
    
    // Wait between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("Seeding complete!");
}

seedActivities().catch(console.error);
